# Changelog

All notable changes to ByteSync Editor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2025-10-14

### Changed
- Minor ui changes

## [1.3.0] - 2025-10-14

### Added
- 4-in-1 Mode: All formats (ASCII, Hex, Decimal, Binary) displayed simultaneously in textarea view
- Data Analysis Panel with real-time statistics:
  - Total bytes, non-zero bytes, unique bytes count
  - Entropy calculation for data randomness analysis
  - Most frequent byte values
  - Pattern detection (repeats, sequences, ASCII chars, control chars)
- Enhanced Select All functionality that works properly in 4-in-1 mode
- Improved Context Menu with right-click support and quick actions
- Smart Copy/Paste with intelligent clipboard integration and format detection
- Delimiter options for 4-in-1 mode (none, comma, space, custom)
- Individual copy buttons for each format in 4-in-1 mode
- Copy All Formats button for 4-in-1 mode

### Changed
- Arrow key navigation now preserves default browser behavior instead of custom grid navigation
- Enhanced paste options for better handling of invalid characters
- Improved cross-tab highlighting and synchronization
- Better keyboard shortcut handling with improved Mac compatibility
- Updated UI with better organization of features and controls

### Fixed
- Select All functionality now works correctly in 4-in-1 mode, selecting only the active textarea
- Fixed arrow key navigation issues that were preventing proper input navigation
- Improved textarea selection behavior in 4-in-1 mode
- Enhanced tab switching and focus management across all modes
- Fixed context menu positioning and interaction issues

### Technical Improvements
- Refactored `selectAllCells()` function to handle both grid and textarea modes
- Updated `clearAllSelection()` function for better textarea support
- Improved event handling for better cross-platform compatibility
- Enhanced error handling and user feedback

## [1.0.0] - 2025-01-01

### Added
- Initial release of ByteSync Editor
- Multi-format byte editing support:
  - ASCII character view
  - Hexadecimal view (0x00-0xFF)
  - Decimal view (0-255)
  - Binary view (8-bit)
- Real-time synchronization across all format views
- Auto-navigation between cells when input limits are reached
- Copy/paste functionality with clipboard integration
- Paste options for handling invalid characters (skip, empty, custom)
- Theme support with light and dark modes
- Responsive design for desktop and mobile devices
- Keyboard shortcuts for navigation and mode switching
- Context menu support with right-click actions
- Cross-tab highlighting for active cell synchronization
- Special character insertion (CR, LF) with keyboard shortcuts
- Data validation and input sanitization
- Grid-based 16x16 byte editing interface

### Technical Features
- Electron-based desktop application
- Web application support
- CSS custom properties for theming
- Modern JavaScript (ES6+) with module support
- Jest testing framework integration
- Cross-platform build support (Windows, macOS, Linux)
- Package management with Yarn

---

## Version Numbering

- **Major version** (X.0.0): Breaking changes or major feature additions
- **Minor version** (1.X.0): New features, improvements, or significant enhancements
- **Patch version** (1.0.X): Bug fixes, minor improvements, or documentation updates

## Release Notes

For detailed release notes and migration guides, please refer to the [README.md](README.md) file.
