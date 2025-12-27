import 'dart:convert';
import 'dart:io';

import 'package:vector_graphics_compiler/vector_graphics_compiler.dart';

String compile(
  String svg, {
  required String name,
  bool optimizeOverdraw = true,
  bool canRetry = true,
}) {
  try {
    final bytes = encodeSvg(xml: svg, debugName: name, enableOverdrawOptimizer: optimizeOverdraw);
    return base64Encode(bytes);
  } catch (error) {
    // Retry with less settings
    if (canRetry) return compile(svg, name: name, canRetry: false, optimizeOverdraw: false);

    stderr
      ..write('Failed to parse icon: $name\n')
      ..write(error);

    rethrow;
  }
}

Future<void> main(List<String> args) async {
  final args = stdin.readLineSync()!;
  final data = jsonDecode(args) as List<dynamic>;

  initializePathOpsFromFlutterCache();

  for (final entry in data) {
    entry as Map;

    if (entry case {'name': final String name, 'svg': final String svg}) {
      entry['svgCompiled'] = compile(svg, name: name);
    }
  }

  stdout
    ..write(jsonEncode(data))
    ..close();
}
