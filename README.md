# ByteSync Editor v1.41.3

A powerful cross-platform byte editor available as both a desktop application and web application. Edit bytes in ASCII, Hex, Decimal, and Binary formats with real-time synchronization across all views.

## 🚀 Quick Start

### Desktop Application (Electron)
```bash
# Install dependencies
yarn install

# Start the application
yarn start

# Build for your platform
yarn build
```

### Web Application
```bash
# Install dependencies
yarn install

# Start local server
yarn start

# Or simply open index.html in your browser
```

## ✨ Features

### Core Functionality
- **Multi-format editing**: ASCII, Hex, Decimal, and Binary views
- **Real-time sync**: Edit in any format, see changes everywhere
- **4-in-1 Mode**: All formats displayed simultaneously in textarea view
- **Auto-navigation**: Automatically move to next cell when limit reached
- **Smart copy/paste**: Intelligent clipboard integration with format detection

### Advanced Features
- **Data Analysis**: Real-time statistics, entropy calculation, and pattern detection
- **Paste options**: Handle invalid characters gracefully (skip, empty, custom)
- **Context menu**: Right-click for quick actions (copy, paste, select all, clear)
- **Keyboard shortcuts**: Full keyboard navigation and shortcuts
- **Theme support**: Light and dark themes with CSS custom properties
- **PWA Support**: Install as native app, works offline
- **Cross-platform**: Works on Windows, macOS, and Linux

### Navigation & Editing
- **Tab switching**: Shift + 1,2,3,4,5 for quick mode switching
- **Select All**: Ctrl+A (Cmd+A on Mac) works in all modes including 4-in-1
- **Special characters**: Cmd+Enter for CR, Cmd+Shift+Enter for LF
- **Grid navigation**: 16x16 byte grid with cross-tab highlighting

## ⌨️ Keyboard Shortcuts

### Navigation & Mode Switching
- `Shift + 1` - ASCII Mode
- `Shift + 2` - Hex Mode  
- `Shift + 3` - Decimal Mode
- `Shift + 4` - Binary Mode
- `Shift + 5` - 4-in-1 Mode

### Selection & Editing
- `Ctrl+A` / `Cmd+A` - Select All (works in all modes)
- `Delete` / `Backspace` - Clear All (when all selected)
- `Enter` - Move to next cell
- `Backspace` - Move to previous cell (when current cell is empty)

### Special Characters
- `Cmd+Enter` - Add CR (Carriage Return)
- `Cmd+Shift+Enter` - Add LF (Line Feed)

### Context Menu
- `Right-click` - Open context menu with quick actions
- `Ctrl+Click` - Alternative context menu (Mac compatible)

## 🛠️ Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Start development server
yarn dev

# Build application
yarn build
```

## 🔄 Version Management

ByteSync Editor includes an automated version management system that updates all version references across the project.

### Available Commands

```bash
# Patch version (bug fixes, minor improvements)
yarn version:patch   # 1.41.3 → 1.41.4

# Minor version (new features, enhancements)
yarn version:minor   # 1.41.3 → 1.42.0

# Major version (breaking changes, major features)
yarn version:major   # 1.41.3 → 2.0.0
```

### What Gets Updated

The version script automatically updates:
- 📦 **package.json** - `version` field
- 📱 **manifest.json** - `version` field (for PWA)
- 🔧 **sw.js** - `CACHE_NAME` for service worker cache
- 🌐 **index.html** - Title version display

### After Version Update

```bash
# Commit the changes
git add .
git commit -m "chore: versiyon 1.41.4 güncellendi"

# Create and push tag
git tag v1.41.4
git push origin main --tags
```

## 📦 Building

### Desktop Application
```bash
# Build for current platform
yarn build

# Build for specific platforms
yarn build:mac
yarn build:win
yarn build:linux
```

### Web Application
The web version requires no build process. Simply serve the files or open `index.html` directly in a browser.

## 📋 Version History

### v1.41.3 (Current)
**New Features:**
- ✅ **Automated Version Management**: Script-based version updating across all files
- ✅ **Notification Helper**: Enhanced notification system for better user feedback
- ✅ **UI Improvements**: Better user interface and experience enhancements
- ✅ **4-in-1 Mode**: All formats displayed simultaneously in textarea view
- ✅ **Data Analysis Panel**: Real-time statistics, entropy calculation, and pattern detection
- ✅ **Enhanced Select All**: Works properly in 4-in-1 mode, selects only active textarea
- ✅ **Improved Context Menu**: Right-click support with quick actions
- ✅ **Smart Copy/Paste**: Intelligent clipboard integration with format detection

**Improvements:**
- 🔧 **Version Script**: Automated version management with `yarn version:patch/minor/major`
- 🔧 **Service Worker**: Updated cache management for better PWA performance
- 🔧 **Manifest**: Enhanced PWA manifest with proper versioning
- 🔧 Fixed arrow key navigation to preserve default browser behavior
- 🔧 Enhanced paste options for handling invalid characters
- 🔧 Improved cross-tab highlighting and synchronization
- 🔧 Better keyboard shortcut handling and Mac compatibility

**Bug Fixes:**
- 🐛 Fixed Select All functionality in 4-in-1 mode
- 🐛 Fixed arrow key navigation issues
- 🐛 Improved textarea selection behavior
- 🐛 Enhanced tab switching and focus management

### v1.0.0
**Initial Release:**
- 🎉 Multi-format byte editing (ASCII, Hex, Decimal, Binary)
- 🎉 Real-time synchronization across all views
- 🎉 Auto-navigation and smart input handling
- 🎉 Copy/paste functionality
- 🎉 Theme support and responsive design
- 🎉 Keyboard shortcuts and navigation

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run tests for CI
yarn test:ci
```

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔧 Customization

The app uses CSS custom properties for theming. Modify `styles.css` to change colors and appearance.

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please open an issue on GitHub with:
- Clear description of the problem/request
- Steps to reproduce (for bugs)
- Browser and OS information
- Screenshots if applicable
