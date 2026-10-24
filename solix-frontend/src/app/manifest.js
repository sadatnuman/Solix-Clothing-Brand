export default function manifest() {
  return {
    name: 'Solix Bangladesh',
    short_name: 'Solix',
    description: 'Premium clothing, Panjabi, watches and modern essentials from Solix Bangladesh.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f2e9',
    theme_color: '#111858',
    icons: [{ src: '/images/solix-royal-logo.jpg', sizes: '960x960', type: 'image/jpeg', purpose: 'any maskable' }],
  };
}
