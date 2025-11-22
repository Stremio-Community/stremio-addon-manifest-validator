# Stremio Addon Manifest Validator

A simple, user-friendly web application for validating Stremio addon `manifest.json` files. This tool helps developers ensure their addons comply with the official Stremio Manifest schema by providing detailed error reporting and warnings for unknown fields.

## Features

- **Full Schema Validation**: Validates your manifest using the type-safe, community-maintained [@stremio-addon/zod](https://github.com/stremio-community/stremio-addon-sdk) package.
- **Strict Mode Analysis**: Detects and warns about unknown or extra fields that are not part of the official specification.
- **Flexible Input**:
  - Paste JSON content directly.
  - Enter a URL to a hosted manifest (e.g., `https://my-addon.com/manifest.json`).
  - Drag and drop your `manifest.json` file.
- **Shareable States**: Generate a unique, shareable URL that contains your current manifest data (compressed), allowing you to easily share validation results with others.
- **Auto-Formatting**: Automatically formats and beautifies valid JSON input.
- **Dark Mode**: Built-in dark and light mode support.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Tech Stack

- **Framework**: [React](https://react.dev/) (via [Vite](https://vitejs.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (latest LTS, v24 or higher recommended at the time of writing)
- pnpm v10

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/stremio-community/stremio-addon-manifest-validator.git
   cd stremio-addon-manifest-validator
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

Build the application for production:

```bash
pnpm build
```

To preview the production build locally:

```bash
pnpm preview
```

### Linting & Formatting

- **Lint**: Check for code issues.
  ```bash
  pnpm lint
  ```
- **Format**: Format code using Prettier.
  ```bash
  pnpm format:fix
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](./LICENSE)
