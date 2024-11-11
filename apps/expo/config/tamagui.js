import { createTamagui } from '@tamagui/core';

const tamaguiConfig = createTamagui({
  tokens: {
    color: {
      primary: '#3498db',
      secondary: '#f1c40f',
      background: '#f9f9f9',
      text: '#333',
    },
    space: {
      small: 8,
      medium: 16,
      large: 24,
    },
    radius: {
      small: 4,
      medium: 8,
      large: 12,
    },
  },
  components: [
    // Layout components
    'View',
    'ScrollView',
    'FlatList',
    'SectionList',
    'Grid',
    'Flex',
    'Box',
    'Container',
    'Header',
    'Footer',
    'Sidebar',
    'Main',

    // Text components
    'Text',
    'Heading',
    'Paragraph',
    'Label',
    'Input',
    'Textarea',
    'Button',
    'Link',
    'Badge',

    // Image components
    'Image',
    'Avatar',
    'Icon',
    'Logo',

    // Button components
    'Button',
    'IconButton',
    'Fab',
    'Chip',
    'Tag',

    // Form components
    'Form',
    'FormField',
    'Input',
    'Textarea',
    'Select',
    'Checkbox',
    'Radio',
    'Switch',
    'Slider',
    'DatePicker',
    'TimePicker',

    // Navigation components
    'Navigation',
    'TabBar',
    'Tab',
    'Drawer',
    'Sidebar',
    'Menu',
    'MenuItem',

    // Social media components
    'SocialMediaButton',
    'FacebookButton',
    'TwitterButton',
    'InstagramButton',
    'LinkedInButton',
    'YouTubeButton',
    'GitHubButton',
    'RedditButton',
    'PinterestButton',
    'WhatsAppButton',
    'TelegramButton',
    'DiscordButton',
    'TikTokButton',
    'SnapchatButton',
    'TwitchButton',
    'TwitchStreamButton',
    'SpotifyButton',
    'AppleMusicButton',
    'GooglePlayMusicButton',
    'AmazonMusicButton',
    'SoundCloudButton',
    'VimeoButton',
    'GooglePodcastsButton',
    'ApplePodcastsButton',
    'SpotifyPodcastsButton',
    'StitcherButton',
    'TuneInButton',
    'AudioboomButton',
    'AnchorButton',
    'CastboxButton',
  ],
});

export default tamaguiConfig;