# ByteSync Editor v1.3.0

A powerful byte editor that works directly in your web browser. Edit bytes in ASCII, Hex, Decimal, and Binary formats with real-time synchronization across all views.

## 🌐 Live Demo

[Try ByteSync Editor Online](https://kaangrbz.github.io/byte-sync-editor/) <!-- Replace with your actual domain -->

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
- **Responsive design**: Works on desktop and mobile devices

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
- `Space` - Add space character (ASCII 32, except in decimal mode)
- `Backspace` - Move to previous cell (when current cell is empty)

### Special Characters
- `Cmd+Enter` - Add CR (Carriage Return)
- `Cmd+Shift+Enter` - Add LF (Line Feed)

### Context Menu
- `Right-click` - Open context menu with quick actions
- `Ctrl+Click` - Alternative context menu (Mac compatible)

## 🚀 Quick Start

### Option 1: Direct File Access
1. Download all files
2. Open `index.html` in your browser
3. Start editing bytes!

### Option 2: Local Server
```bash
# Install dependencies
yarn install

# Start local server
yarn start

# Open http://localhost:3000
```

## 📦 Deployment Options

### GitHub Pages
1. Push code to GitHub repository
2. Go to Settings > Pages
3. Select source branch
4. Your app will be available at `https://username.github.io/repository-name`

### Netlify
1. Connect your GitHub repository
2. Set build command: `echo "No build needed"`
3. Set publish directory: `.`
4. Deploy!

### Vercel
1. Import your GitHub repository
2. Set framework: "Other"
3. Set build command: `echo "No build needed"`
4. Deploy!

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy
```

## 🛠️ Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Open http://localhost:3000
```

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔧 Customization

The app uses CSS custom properties for theming. Modify `styles.css` to change colors and appearance.

## 📋 Version History

### v1.3.0 (Current)
**New Features:**
- ✅ 4-in-1 Mode: All formats displayed simultaneously in textarea view
- ✅ Data Analysis Panel: Real-time statistics, entropy calculation, and pattern detection
- ✅ Enhanced Select All: Works properly in 4-in-1 mode, selects only active textarea
- ✅ Improved Context Menu: Right-click support with quick actions
- ✅ Smart Copy/Paste: Intelligent clipboard integration with format detection

**Improvements:**
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
