import 'package:flutter/material.dart';
import 'package:total_iconify/icons/academicons.dart';
import 'package:total_iconify/icons/brandico.dart';
import 'package:total_iconify/icons/fluent_emoji_flat.dart';
import 'package:total_iconify/icons/line_md.dart';
import 'package:total_iconify/icons/streamline_kameleon_color.dart';
import 'package:total_iconify/total_iconify.dart';

void main() {
  runApp(
    MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple)),
      home: const App(),
    ),
  );
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Iconify(Brandico.youku, width: 96, height: 96),
            IconTheme(
              data: IconThemeData(size: 128, color: Colors.blue),
              child: Iconify(Academicons.open_access),
            ),
            Iconify(LineMd.youtube, size: 96),
            Iconify(FluentEmojiFlat.flushed_face, size: 96, inheritThemeColor: false),
            Iconify(StreamlineKameleonColor.woman_15, size: 96, inheritThemeColor: false),
          ],
        ),
      ),
    );
  }
}
