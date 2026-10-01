import { NextRequest, NextResponse } from 'next/server';
import { CURATED_STARTER_COURSES, extractPlaylistId, extractVideoId } from '@/lib/youtube';
import { Playlist, VideoItem } from '@/types';

// Convert formatted timestamp (e.g. "4:08" or "1:15:30") to seconds
function parseDurationText(durationText: string): number {
  if (!durationText) return 1200;
  const parts = durationText.trim().split(':').map(p => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 1200;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urlOrId = (body.url || '').trim();
    const customName = (body.customName || '').trim();

    if (!urlOrId) {
      return NextResponse.json({ error: 'Please provide a valid YouTube URL' }, { status: 400 });
    }

    const playlistId = extractPlaylistId(urlOrId);
    const singleVideoId = extractVideoId(urlOrId);

    // 1. Check if user pasted a curated starter course
    if (playlistId) {
      const matchedStarter = CURATED_STARTER_COURSES.find(c => c.ytPlaylistId === playlistId);
      if (matchedStarter) {
        const cloned: Playlist = {
          ...matchedStarter,
          id: 'pl_' + Date.now().toString(36),
          customTitle: customName || matchedStarter.customTitle,
          createdAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
        };
        return NextResponse.json(cloned);
      }
    }

    // 2. If it's a Playlist URL, scrape live YouTube playlist metadata & video list
    if (playlistId) {
      try {
        const ytUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const res = await fetch(ytUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`YouTube responded with status ${res.status}`);
        }

        const html = await res.text();
        const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || html.match(/ytInitialData = ({[\s\S]*?});/);
        
        if (!match) {
          throw new Error('Unable to extract playlist data from YouTube');
        }

        const data = JSON.parse(match[1]);

        // Extract Playlist Title
        const realTitle = data?.metadata?.playlistMetadataRenderer?.title ||
          data?.header?.playlistHeaderRenderer?.title?.simpleText ||
          data?.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ||
          `Playlist (${playlistId.slice(0, 10)})`;

        // Extract Playlist Creator
        const author = data?.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ||
          data?.metadata?.playlistMetadataRenderer?.author ||
          'YouTube Creator';

        // Extract Videos
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const sectionList = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        
        const extractedVideos: VideoItem[] = [];

        for (const section of sectionList) {
          const itemContents = section.itemSectionRenderer?.contents || [];
          for (const item of itemContents) {
            // Modern YouTube format (lockupViewModel)
            if (item.lockupViewModel) {
              const lockup = item.lockupViewModel;
              const videoId = lockup.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId;
              
              let title = lockup.metadata?.lockupMetadataViewModel?.title?.content;
              if (!title && lockup.rendererContext?.accessibilityContext?.label) {
                title = lockup.rendererContext.accessibilityContext.label.split(/[0-9]+ (?:min|minutes|মিনিট|সেকেন্ড|second)/i)[0].trim();
              }
              
              const durationFormatted = lockup.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text || 'Dynamic';
              const durationSeconds = parseDurationText(durationFormatted);
              const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              if (videoId) {
                extractedVideos.push({
                  id: `vid_${videoId}_${extractedVideos.length}`,
                  ytVideoId: videoId,
                  title: title || `Lesson ${extractedVideos.length + 1}`,
                  durationSeconds,
                  durationFormatted,
                  thumbnailUrl,
                });
              }
            }

            // Classic YouTube format (playlistVideoRenderer)
            if (item.playlistVideoRenderer) {
              const pvr = item.playlistVideoRenderer;
              const videoId = pvr.videoId;
              const title = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText;
              const durationFormatted = pvr.lengthText?.simpleText || 'Dynamic';
              const durationSeconds = parseDurationText(durationFormatted);
              const thumbnailUrl = pvr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              if (videoId) {
                extractedVideos.push({
                  id: `vid_${videoId}_${extractedVideos.length}`,
                  ytVideoId: videoId,
                  title: title || `Lesson ${extractedVideos.length + 1}`,
                  durationSeconds,
                  durationFormatted,
                  thumbnailUrl,
                });
              }
            }
          }
        }

        // Fallback to playlistVideoListRenderer if nested directly
        const directList = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
        if (directList && directList.length > 0 && extractedVideos.length === 0) {
          for (const item of directList) {
            if (item.playlistVideoRenderer) {
              const pvr = item.playlistVideoRenderer;
              const videoId = pvr.videoId;
              const title = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText;
              const durationFormatted = pvr.lengthText?.simpleText || 'Dynamic';
              const durationSeconds = parseDurationText(durationFormatted);
              const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              if (videoId) {
                extractedVideos.push({
                  id: `vid_${videoId}_${extractedVideos.length}`,
                  ytVideoId: videoId,
                  title: title || `Lesson ${extractedVideos.length + 1}`,
                  durationSeconds,
                  durationFormatted,
                  thumbnailUrl,
                });
              }
            }
          }
        }

        if (extractedVideos.length > 0) {
          const finalTitle = customName || realTitle;
          const course: Playlist = {
            id: 'pl_' + Date.now().toString(36),
            userId: 'user_active',
            ytPlaylistId: playlistId,
            customTitle: finalTitle,
            originalTitle: `${realTitle} (${author})`,
            thumbnailUrl: extractedVideos[0].thumbnailUrl,
            totalVideos: extractedVideos.length,
            completedVideos: 0,
            videos: extractedVideos,
            sourceType: 'youtube_playlist',
            lastSyncedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };

          return NextResponse.json(course);
        }
      } catch (err) {
        console.error('Playlist scraping error:', err);
      }
    }

    // 3. If it's a Single Video URL
    if (singleVideoId) {
      let videoTitle = customName || '';
      let authorName = 'YouTube Instructor';
      let thumbnailUrl = `https://img.youtube.com/vi/${singleVideoId}/hqdefault.jpg`;

      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${singleVideoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (!videoTitle && oembedData.title) videoTitle = oembedData.title;
          if (oembedData.author_name) authorName = oembedData.author_name;
          if (oembedData.thumbnail_url) thumbnailUrl = oembedData.thumbnail_url;
        }
      } catch {}

      const courseTitle = videoTitle || `Lecture: ${singleVideoId}`;
      const singleVideoItem: VideoItem = {
        id: `vid_${singleVideoId}`,
        ytVideoId: singleVideoId,
        title: videoTitle || `Lecture: ${courseTitle}`,
        durationSeconds: 1800,
        durationFormatted: 'Dynamic',
        thumbnailUrl,
      };

      const course: Playlist = {
        id: 'pl_' + Date.now().toString(36),
        userId: 'user_active',
        ytPlaylistId: `pl_${singleVideoId}`,
        customTitle: courseTitle,
        originalTitle: `${courseTitle} (${authorName})`,
        thumbnailUrl,
        totalVideos: 1,
        completedVideos: 0,
        videos: [singleVideoItem],
        sourceType: 'youtube_playlist',
        lastSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(course);
    }

    return NextResponse.json({ error: 'Could not resolve playlist or video from provided URL' }, { status: 404 });
  } catch (err: any) {
    console.error('API /api/youtube error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error processing YouTube URL' }, { status: 500 });
  }
}
