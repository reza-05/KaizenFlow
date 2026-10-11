import { NextRequest, NextResponse } from 'next/server';
import { CURATED_STARTER_COURSES, extractPlaylistId, extractVideoId, decodeHtmlEntities } from '@/lib/youtube';
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
      return NextResponse.json({ error: 'Please enter a YouTube playlist URL, video link, or study topic.' }, { status: 400 });
    }

    const playlistId = extractPlaylistId(urlOrId);
    const singleVideoId = extractVideoId(urlOrId);

    // 1. Check if user pasted a curated starter course ID
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

    // 2. If it's a Playlist URL, resolve via YouTube HTML scraping or official RSS feed
    if (playlistId) {
      let realTitle = `Playlist (${playlistId.slice(0, 10)})`;
      let author = 'YouTube Creator';
      const extractedVideos: VideoItem[] = [];

      // Step 2A: Live HTML Scraping (Full video list + precise durations)
      try {
        const ytUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const res = await fetch(ytUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const html = await res.text();
          const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || html.match(/ytInitialData = ({[\s\S]*?});/);
          
          if (match) {
            const data = JSON.parse(match[1]);

            // Extract Playlist Title
            const candidateTitle = data?.metadata?.playlistMetadataRenderer?.title ||
              data?.header?.playlistHeaderRenderer?.title?.simpleText ||
              data?.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text;
            if (candidateTitle) realTitle = decodeHtmlEntities(candidateTitle);

            // Extract Playlist Creator
            const candidateAuthor = data?.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ||
              data?.metadata?.playlistMetadataRenderer?.author;
            if (candidateAuthor) author = decodeHtmlEntities(candidateAuthor);

            // Extract Videos from sections
            const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
            const sectionList = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

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

                  if (videoId && videoId.length >= 10) {
                    const cleanTitle = decodeHtmlEntities(title || `Lesson ${extractedVideos.length + 1}`);
                    if (!cleanTitle.toLowerCase().includes('[private video]') && !cleanTitle.toLowerCase().includes('[deleted video]')) {
                      extractedVideos.push({
                        id: `vid_${videoId}_${extractedVideos.length}`,
                        ytVideoId: videoId,
                        title: cleanTitle,
                        durationSeconds,
                        durationFormatted,
                        thumbnailUrl,
                      });
                    }
                  }
                }

                // Classic YouTube format (playlistVideoRenderer)
                if (item.playlistVideoRenderer) {
                  const pvr = item.playlistVideoRenderer;
                  const videoId = pvr.videoId;
                  const rawTitle = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText;
                  const durationFormatted = pvr.lengthText?.simpleText || 'Dynamic';
                  const durationSeconds = parseDurationText(durationFormatted);
                  const thumbnailUrl = pvr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                  if (videoId && videoId.length >= 10) {
                    const cleanTitle = decodeHtmlEntities(rawTitle || `Lesson ${extractedVideos.length + 1}`);
                    if (!cleanTitle.toLowerCase().includes('[private video]') && !cleanTitle.toLowerCase().includes('[deleted video]')) {
                      extractedVideos.push({
                        id: `vid_${videoId}_${extractedVideos.length}`,
                        ytVideoId: videoId,
                        title: cleanTitle,
                        durationSeconds,
                        durationFormatted,
                        thumbnailUrl,
                      });
                    }
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
                  const rawTitle = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText;
                  const durationFormatted = pvr.lengthText?.simpleText || 'Dynamic';
                  const durationSeconds = parseDurationText(durationFormatted);
                  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                  if (videoId && videoId.length >= 10) {
                    const cleanTitle = decodeHtmlEntities(rawTitle || `Lesson ${extractedVideos.length + 1}`);
                    if (!cleanTitle.toLowerCase().includes('[private video]') && !cleanTitle.toLowerCase().includes('[deleted video]')) {
                      extractedVideos.push({
                        id: `vid_${videoId}_${extractedVideos.length}`,
                        ytVideoId: videoId,
                        title: cleanTitle,
                        durationSeconds,
                        durationFormatted,
                        thumbnailUrl,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('HTML playlist scraping notice:', err);
      }

      // Step 2B: Official YouTube RSS Feed Fallback (100% reliable, official, never blocked)
      if (extractedVideos.length === 0) {
        try {
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
          const rssRes = await fetch(rssUrl, { cache: 'no-store' });
          if (rssRes.ok) {
            const xml = await rssRes.text();
            const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
            if (titleMatch && (!realTitle || realTitle.startsWith('Playlist ('))) {
              realTitle = decodeHtmlEntities(titleMatch[1]);
            }
            const authorMatch = xml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/);
            if (authorMatch && (!author || author === 'YouTube Creator')) {
              author = decodeHtmlEntities(authorMatch[1]);
            }

            const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
            let entryMatch;
            while ((entryMatch = entryRegex.exec(xml)) !== null) {
              const entryXml = entryMatch[1];
              const vidMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
              const titleM = entryXml.match(/<title>([^<]+)<\/title>/);
              const thumbM = entryXml.match(/<media:thumbnail[^>]+url="([^"]+)"/);

              if (vidMatch && vidMatch[1] && vidMatch[1].length >= 10) {
                const vid = vidMatch[1];
                const rawTitle = titleM ? titleM[1] : `Lesson ${extractedVideos.length + 1}`;
                const itemTitle = decodeHtmlEntities(rawTitle);
                const thumb = thumbM ? thumbM[1] : `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

                if (!itemTitle.toLowerCase().includes('[private video]') && !itemTitle.toLowerCase().includes('[deleted video]')) {
                  extractedVideos.push({
                    id: `vid_${vid}_${extractedVideos.length}`,
                    ytVideoId: vid,
                    title: itemTitle,
                    durationSeconds: 1200,
                    durationFormatted: 'Video',
                    thumbnailUrl: thumb,
                  });
                }
              }
            }
          }
        } catch (rssErr) {
          console.warn('RSS playlist fallback notice:', rssErr);
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
    }

    // 3. If it's a Single Video URL (or watch link where playlist had 0 videos)
    if (singleVideoId) {
      let videoTitle = customName || '';
      let authorName = 'YouTube Instructor';
      let thumbnailUrl = `https://img.youtube.com/vi/${singleVideoId}/hqdefault.jpg`;

      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${singleVideoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (!videoTitle && oembedData.title) videoTitle = decodeHtmlEntities(oembedData.title);
          if (oembedData.author_name) authorName = decodeHtmlEntities(oembedData.author_name);
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

    // 4. Intelligent Topic / Keyword Search Fallback
    // If the input is a study topic query (e.g. "Learn Python Bangla", "SSC Physics", "Linear Algebra")
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(urlOrId)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        cache: 'no-store',
      });

      if (searchRes.ok) {
        const searchHtml = await searchRes.text();
        const searchMatch = searchHtml.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || searchHtml.match(/ytInitialData = ({[\s\S]*?});/);
        if (searchMatch) {
          const sData = JSON.parse(searchMatch[1]);
          const sSections = sData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
          const searchVideos: VideoItem[] = [];

          for (const sSec of sSections) {
            const sItems = sSec.itemSectionRenderer?.contents || [];
            for (const sItem of sItems) {
              if (sItem.videoRenderer) {
                const vr = sItem.videoRenderer;
                const vId = vr.videoId;
                const rawVTitle = vr.title?.runs?.[0]?.text || vr.title?.simpleText || '';
                const vTitle = decodeHtmlEntities(rawVTitle);
                const vDuration = vr.lengthText?.simpleText || 'Dynamic';
                const vThumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

                if (vId && vTitle && !vTitle.toLowerCase().includes('[private') && searchVideos.length < 10) {
                  searchVideos.push({
                    id: `vid_${vId}_${searchVideos.length}`,
                    ytVideoId: vId,
                    title: vTitle,
                    durationSeconds: parseDurationText(vDuration),
                    durationFormatted: vDuration,
                    thumbnailUrl: vThumb,
                  });
                }
              }
            }
          }

          if (searchVideos.length > 0) {
            const courseTitle = customName || `Course: ${urlOrId}`;
            const course: Playlist = {
              id: 'pl_' + Date.now().toString(36),
              userId: 'user_active',
              ytPlaylistId: `search_${Date.now().toString(36)}`,
              customTitle: courseTitle,
              originalTitle: `Topic: ${urlOrId}`,
              thumbnailUrl: searchVideos[0].thumbnailUrl,
              totalVideos: searchVideos.length,
              completedVideos: 0,
              videos: searchVideos,
              sourceType: 'youtube_playlist',
              lastSyncedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            return NextResponse.json(course);
          }
        }
      }
    } catch (searchErr) {
      console.warn('Search fallback notice:', searchErr);
    }

    return NextResponse.json({ error: 'Could not resolve playlist or video from the provided input. Please verify the URL or try searching a topic.' }, { status: 404 });
  } catch (err: any) {
    console.error('API /api/youtube error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error processing YouTube URL' }, { status: 500 });
  }
}
