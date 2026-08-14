/// Mock-only demo data. No production / Supabase connection.
class MockShop {
  static const name = 'Bijoux Kigali';
  static const payPhone = '+250 788 000 111';
}

class CreditLine {
  const CreditLine({
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.takenAt,
  });

  final String name;
  final int quantity;
  final int unitPrice;
  final DateTime takenAt;

  int get lineTotal => quantity * unitPrice;
}

class MockCustomer {
  const MockCustomer({
    required this.id,
    required this.name,
    required this.phone,
    required this.remaining,
    required this.total,
    required this.paid,
    required this.lines,
  });

  final String id;
  final String name;
  final String phone;
  final int remaining;
  final int total;
  final int paid;
  final List<CreditLine> lines;
}

final mockCustomer = MockCustomer(
  id: 'c-demo-1',
  name: 'Uwase Claire',
  phone: '+250 788 123 456',
  remaining: 85000,
  total: 120000,
  paid: 35000,
  lines: [
    CreditLine(
      name: 'Bracelet set',
      quantity: 2,
      unitPrice: 25000,
      takenAt: DateTime(2026, 11, 2, 10, 15),
    ),
    CreditLine(
      name: 'Chainette gold',
      quantity: 1,
      unitPrice: 45000,
      takenAt: DateTime(2026, 11, 5, 16, 40),
    ),
    CreditLine(
      name: 'Earrings',
      quantity: 1,
      unitPrice: 25000,
      takenAt: DateTime(2026, 11, 8, 11, 5),
    ),
  ],
);

String formatRwf(int amount) {
  final s = amount.abs().toString();
  final chars = s.split('').reversed.toList();
  final chunks = <String>[];
  for (var i = 0; i < chars.length; i += 3) {
    final end = (i + 3 < chars.length) ? i + 3 : chars.length;
    chunks.add(chars.sublist(i, end).reversed.join());
  }
  final body = chunks.reversed.join(',');
  return 'RWF ${amount < 0 ? '-' : ''}$body';
}
