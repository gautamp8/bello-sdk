# Bello SDK

Embed voice agents into any website in minutes.

## Overview

Bello SDK is a lightweight JavaScript library that enables you to integrate conversational voice agents into your web applications quickly and easily. Transform your website's user experience with natural voice interactions.

**Supports multiple platforms:** HTML/JS, React, WordPress, and Shopify.

## Features

- **Multi-Platform Support** - Works with vanilla JS, React, WordPress, and Shopify
- **Quick Integration** - Get started in minutes with minimal setup
- **Voice-First Experience** - Natural conversation with your users
- **Cross-Browser Support** - Works across all modern browsers
- **Customizable UI** - Adapt the interface to match your brand
- **Real-time Voice Processing** - Low-latency voice recognition and synthesis
- **Event-Driven Architecture** - React to conversation events in your application

## Installation

### HTML/JavaScript (CDN)

```html
<script src="https://unpkg.com/bello-sdk@latest/dist/bello.min.js"></script>
```

### React

```bash
npm install bello-sdk
# or
yarn add bello-sdk
```

### WordPress

1. Download the Bello SDK WordPress plugin from [wordpress.org/plugins/bello-sdk](https://wordpress.org/plugins/bello-sdk)
2. Upload and activate the plugin in your WordPress admin panel
3. Configure your API key in Settings > Bello SDK

### Shopify

1. Visit the [Shopify App Store](https://apps.shopify.com/bello-sdk)
2. Click "Add app" to install Bello SDK
3. Configure your API key in the app settings

## Quick Start

### HTML/JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Voice-Enabled Website</title>
</head>
<body>
  <button id="start-voice">Talk to Agent</button>

  <script src="https://unpkg.com/bello-sdk@latest/dist/bello.min.js"></script>
  <script>
    const bello = new Bello({
      apiKey: 'your-api-key',
      agentId: 'your-agent-id',
      onReady: () => console.log('Agent ready'),
      onMessage: (message) => console.log('Agent said:', message)
    });

    document.getElementById('start-voice').addEventListener('click', () => {
      bello.start();
    });
  </script>
</body>
</html>
```

### React

```jsx
import { useState, useEffect } from 'react';
import { Bello } from 'bello-sdk';

function App() {
  const [bello, setBello] = useState(null);

  useEffect(() => {
    const agent = new Bello({
      apiKey: 'your-api-key',
      agentId: 'your-agent-id',
      onReady: () => console.log('Agent ready'),
      onMessage: (message) => console.log('Agent said:', message)
    });

    setBello(agent);

    return () => agent.destroy();
  }, []);

  return (
    <div>
      <button onClick={() => bello?.start()}>
        Talk to Agent
      </button>
    </div>
  );
}

export default App;
```

Or use the React Hook:

```jsx
import { useBello } from 'bello-sdk/react';

function App() {
  const { start, stop, isListening } = useBello({
    apiKey: 'your-api-key',
    agentId: 'your-agent-id'
  });

  return (
    <button onClick={isListening ? stop : start}>
      {isListening ? 'Stop' : 'Talk to Agent'}
    </button>
  );
}
```

### WordPress

Add the shortcode to any page or post:

```
[bello_agent api_key="your-api-key" agent_id="your-agent-id"]
```

Or use the Gutenberg block: Search for "Bello Voice Agent" in the block inserter.

### Shopify

The Bello SDK app automatically adds a voice agent widget to your store. Configure the appearance and behavior in the app settings:

1. Go to Apps > Bello SDK
2. Enter your API key and agent ID
3. Customize the widget position and styling
4. Click "Save" to activate

## Configuration Options

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `apiKey` | string | Your Bello API key | Yes |
| `agentId` | string | The ID of your configured agent | Yes |
| `language` | string | Language code (e.g., 'en-US') | No |
| `autoStart` | boolean | Start listening automatically | No |
| `customStyles` | object | Custom CSS styling options | No |

## API Reference

### Methods

- `start()` - Start the voice agent
- `stop()` - Stop the voice agent
- `pause()` - Pause listening
- `resume()` - Resume listening
- `sendMessage(text)` - Send a text message to the agent
- `destroy()` - Clean up and remove the agent

### Events

- `onReady` - Triggered when the agent is ready
- `onStart` - Triggered when listening starts
- `onStop` - Triggered when listening stops
- `onMessage` - Triggered when the agent responds
- `onError` - Triggered on errors

## Examples

Check out the `/examples` directory for more detailed implementation examples:

- **HTML/JS**: Basic integration, custom styling, event handling
- **React**: Component integration, hooks usage, TypeScript support
- **WordPress**: Shortcode usage, widget customization, theme integration
- **Shopify**: Theme integration, checkout flow, custom positioning
- **Multi-language Support**: Internationalization across all platforms

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Documentation

For detailed documentation, visit [docs.bello.ai](https://docs.bello.ai)

## Support

- Email: support@bello.ai
- Discord: [Join our community](https://discord.gg/bello)
- Issues: [GitHub Issues](https://github.com/bello/bello-sdk/issues)

## License

MIT License - see LICENSE file for details

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
