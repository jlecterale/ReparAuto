import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** Brand mark (the "R" with the orange hex nut), identical to the web favicon. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0.669434 24.1945 24.1945">
      <Path
        d="M5.36621 7.95361L9.92448 12.1466L9.92448 22.4443L5.36621 22.4442L5.36621 7.95361Z"
        fill="#074C92"
      />
      <Path
        d="M10.2139 13.8503L13.9735 12.2391L18.8762 20.2604L15.1551 22.4088L10.2139 13.8503Z"
        fill="#074C92"
      />
      <Path
        d="M10.6633 6.32672L13.671 6.32672L15.1749 8.93146L13.671 11.5362L10.6633 11.5362L9.15949 8.93146L10.6633 6.32672Z"
        fill="#B9CDE1"
      />
      <Path
        d="M11.0313 6.96512L13.3012 6.96512L14.4362 8.93096L13.3012 10.8968L11.0313 10.8968L9.89629 8.93096L11.0313 6.96512Z"
        fill="#EF6C2A"
      />
      <Path
        d="M18.5967 9.26437L16.8798 6.29069L15.0376 7.35186L15.8973 8.83554L14.0278 12.1869L10.1759 12.1385L8.84929 9.89048L7.02325 10.9646L9.24844 14.6585L15.6219 14.9479L18.5967 9.26437Z"
        fill="#074C92"
      />
      <Path
        d="M5.36426 7.95355L7.09093 10.9446L8.86702 9.9205L8.23995 8.8344L10.2339 5.5824L13.9786 5.51714L14.6101 6.60962L16.4474 5.54684L14.945 2.94627L8.94489 2.94627L5.36426 7.95355Z"
        fill="#074C92"
      />
    </Svg>
  );
}

/** Mark + wordmark lockup used in headers. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <LogoMark size={size} />
      <Text className="text-xl font-extrabold text-primary-900">
        Recar<Text className="text-accent">Garage</Text>
      </Text>
    </View>
  );
}
