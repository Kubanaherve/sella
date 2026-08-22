import 'package:flutter_test/flutter_test.dart';
import 'package:sella_flutter_poc/main.dart';

void main() {
  testWidgets('Dashboard shows Sella brand', (tester) async {
    await tester.pumpWidget(const SellaFlutterPocApp());
    expect(find.text('Sella'), findsOneWidget);
    expect(find.textContaining('RWF'), findsWidgets);
  });
}
