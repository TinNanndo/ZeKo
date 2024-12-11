import fs from 'fs';
import path from 'path';

export default ({ config }: { config: any }): any => {
  const fontsDir = path.resolve(__dirname, './assets/fonts');
  const fontFiles = fs.readdirSync(fontsDir).map(file => path.join(fontsDir, file));

  return {
    ...config,
    name: config.name || 'default-name',
    slug: config.slug || 'default-slug',
    plugins: [
      [
        'expo-font',
        {
          fonts: fontFiles,
        },
      ],
    ],
  };
};