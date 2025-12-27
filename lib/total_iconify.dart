import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:vector_graphics/vector_graphics.dart';

class Base64Loader extends BytesLoader {
  const Base64Loader(this.base64);
  final String base64;

  @override
  Future<ByteData> loadBytes(BuildContext? context) async {
    final data = base64Decode(base64);
    return data.buffer.asByteData();
  }

  @override
  int get hashCode => Object.hash(base64, null);

  @override
  bool operator ==(Object other) {
    return other is Base64Loader && other.base64 == base64;
  }

  @override
  String toString() => 'VectorGraphicBase64($base64)';
}

class Iconify extends StatelessWidget {
  const Iconify(
    this.base64Data, {
    super.key,
    this.color,
    this.width,
    this.height,
    this.size,
    this.semanticsLabel,
    this.blendMode = BlendMode.srcIn,
    this.alignment = Alignment.center,
    this.clipBehavior = Clip.none,
    this.matchTextDirection = false,
    this.excludeFromSemantics = false,
    this.inheritThemeColor = true,
  });

  final String base64Data;
  final double? width, height, size;
  final Color? color;
  final BlendMode blendMode;
  final String? semanticsLabel;
  final AlignmentGeometry alignment;
  final Clip clipBehavior;
  final bool excludeFromSemantics, matchTextDirection, inheritThemeColor;

  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    final color = this.color ?? (inheritThemeColor ? theme.color : null);

    return VectorGraphic(
      loader: Base64Loader(base64Data),

      semanticsLabel: semanticsLabel,
      excludeFromSemantics: excludeFromSemantics,
      matchTextDirection: matchTextDirection,

      clipBehavior: clipBehavior,
      alignment: alignment,

      width: width ?? size ?? theme.size,
      height: height ?? size ?? theme.size,
      colorFilter: color != null ? ColorFilter.mode(color, blendMode) : null,
    );
  }
}
