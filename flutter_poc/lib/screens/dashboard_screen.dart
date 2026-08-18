import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../data/mock_data.dart';
import '../theme/sella_theme.dart';
import 'customer_profile_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 168,
            pinned: true,
            backgroundColor: SellaColors.blueDeep,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  color: SellaColors.blueDeep,
                ),
                padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Image.asset('assets/brand/sella-icon.png', width: 44, height: 44),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Sella',
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 28,
                              height: 1.1,
                            ),
                          ),
                          Text(
                            MockShop.name,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Uyu munsi',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: SellaColors.muted,
                      letterSpacing: 0.4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _HeroMoney(amount: 246000),
                  const SizedBox(height: 8),
                  Text(
                    'Amafaranga yakiriwe · MoMo + cash',
                    style: GoogleFonts.plusJakartaSans(
                      color: SellaColors.muted,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const _MetricRow(),
                  const SizedBox(height: 28),
                  Text(
                    'Abakiriya bafite ideni',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _DebtPreviewCard(
                    onOpen: () {
                      Navigator.of(context).push(
                        PageRouteBuilder(
                          pageBuilder: (context, a, secondary) =>
                              const CustomerProfileScreen(),
                          transitionsBuilder: (context, a, secondary, child) {
                            return FadeTransition(
                              opacity: a,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0.04, 0),
                                  end: Offset.zero,
                                ).animate(CurvedAnimation(
                                  parent: a,
                                  curve: Curves.easeOutCubic,
                                )),
                                child: child,
                              ),
                            );
                          },
                          transitionDuration: const Duration(milliseconds: 320),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 40),
                  Center(
                    child: Text(
                      'Flutter PoC · mock data only',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: SellaColors.muted,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroMoney extends StatelessWidget {
  const _HeroMoney({required this.amount});
  final int amount;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutCubic,
      builder: (context, t, _) {
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(0, 12 * (1 - t)),
            child: Text(
              formatRwf(amount),
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                fontSize: 36,
                color: SellaColors.ink,
                height: 1.05,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _MetricTile(
            label: 'Ideni',
            value: formatRwf(312000),
            color: SellaColors.warning,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MetricTile(
            label: 'Stock',
            value: '48',
            color: SellaColors.blue,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MetricTile(
            label: 'Abakiriya',
            value: '26',
            color: SellaColors.success,
          ),
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: SellaColors.muted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _DebtPreviewCard extends StatelessWidget {
  const _DebtPreviewCard({required this.onOpen});
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final c = mockCustomer;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Hero(
                tag: 'avatar-${c.id}',
                child: CircleAvatar(
                  radius: 26,
                  backgroundColor: SellaColors.blue.withValues(alpha: 0.12),
                  child: Text(
                    c.name.characters.first,
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w800,
                      color: SellaColors.blueDeep,
                      fontSize: 20,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      c.name,
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      c.phone,
                      style: GoogleFonts.plusJakartaSans(
                        color: SellaColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatRwf(c.remaining),
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w800,
                      color: SellaColors.danger,
                      fontSize: 14,
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: SellaColors.muted),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
