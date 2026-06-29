import { Pressable, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { getYoutubeThumbnail, getYoutubeWatchUrl } from '@/lib/youtube';

interface VideoPreviewProps {
  /** Any YouTube URL (watch, youtu.be, embed, shorts, live). */
  url: string;
  /** Horizontal padding around the card, so the 16:9 frame fits the content width. */
  horizontalPadding?: number;
}

/**
 * Tappable YouTube preview: shows the video poster with a play overlay and opens
 * the clip in an in-app browser tab (which hands off to the YouTube app when
 * installed). Renders nothing when the URL is not a valid YouTube link.
 */
export function VideoPreview({ url, horizontalPadding = 32 }: VideoPreviewProps) {
  const { width } = useWindowDimensions();
  const thumbnail = getYoutubeThumbnail(url);
  const watchUrl = getYoutubeWatchUrl(url);
  if (!thumbnail || !watchUrl) return null;

  const frameWidth = width - horizontalPadding;
  const frameHeight = (frameWidth * 9) / 16;

  return (
    <Pressable
      onPress={() => WebBrowser.openBrowserAsync(watchUrl)}
      accessibilityRole="button"
      accessibilityLabel="Reproduzir vídeo no YouTube"
      className="overflow-hidden rounded-2xl bg-black active:opacity-90"
      style={{ width: frameWidth, height: frameHeight }}
    >
      <Image
        source={thumbnail}
        style={{ width: frameWidth, height: frameHeight }}
        contentFit="cover"
        transition={200}
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55">
          <Ionicons name="logo-youtube" size={34} color="#ff0000" />
        </View>
      </View>
    </Pressable>
  );
}
