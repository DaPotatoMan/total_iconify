# total_iconify

A **complete Iconify icon pack for Flutter**, precompiled for performance and developer experience.  
Browse, import, and use thousands of icons with IDE hover previews and zero runtime SVG parsing.

---

## ✨ Features

- 🚀 **Precompiled binary SVGs** for fast rendering
- 👀 **IDE icon preview** on hover
- 🌳 **Tree-shakable** – only the icons you use are bundled
- 🔄 **Always up-to-date** with the latest Iconify collections
- 🎨 **IconTheme support** (size & color)
- 😀 **Native support for colored icons & emojis**

---

## 📦 Installation

Add the package to your project:

```bash
dart pub add total_iconify
```

## 🚀 Usage

Import the core widget and the icon sets you need:

```dart
import 'package:total_iconify/total_iconify.dart';

// Import any icon set you need
import 'package:total_iconify/icons/academicons.dart';
import 'package:total_iconify/icons/fluent_emoji_flat.dart';
```

#### Basic usage
```dart
Iconify(
  Academicons.open_access,
  width: 32,
  height: 32,
);
```
#### Using a single size
```dart
Iconify(
  Academicons.open_access,
  size: 96,
);
```

#### Inheriting from IconTheme
```dart
IconTheme(
  data: const IconThemeData(
    size: 128,
    color: Colors.blue,
  ),
  child: Iconify(Academicons.open_access),
);
```

#### Colored icons (emojis, multi-color SVGs)
```dart
Iconify(
  FluentEmojiFlat.flushed_face,
  size: 96,
  inheritThemeColor: false,
);
```

## 🧠 Iconify Widget Behavior

The `Iconify` widget automatically inherits styling from the nearest `IconTheme`.

### Inherited properties

- **Size** from `IconThemeData.size`
- **Color** from `IconThemeData.color`

### Disabling color inheritance

For colored icons (such as emojis or multi-color SVGs), you may want to prevent
the icon from inheriting the theme color:

```dart
Iconify(
  FluentEmojiFlat.flushed_face,
  inheritThemeColor: false,
);
```


## Building From Source

### Prerequisites

- Node.js >= 20
- Flutter / Dart
- pnpm

### Build Steps

```bash
cd generator
pnpm install
pnpm run build

cd ..
dart pub get
dart analyze
```

## 🙌 Credits

- [Iconify](https://iconify.design)
- [icones.js.org](https://icones.js.org)
- [iconify_flutter](https://github.com/andronasef/iconify_flutter)
- And **YOU** 🫵😎
