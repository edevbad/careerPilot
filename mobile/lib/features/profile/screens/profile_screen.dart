import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/auth/auth_controller.dart';
import '../../../core/repositories/auth_repository.dart';
import '../../../core/models/user_model.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _authRepo = AuthRepository();
  bool _isLoading = false;

  // Editing state
  bool _editingName = false;
  bool _editingGoal = false;
  late TextEditingController _nameCtrl;
  late TextEditingController _goalCtrl;

  UserModel? get _user => AuthController.instance.currentUser;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: _user?.name ?? '');
    _goalCtrl = TextEditingController(text: _user?.careerGoal ?? '');
    // Refresh from server in background
    _refreshProfile();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _goalCtrl.dispose();
    super.dispose();
  }

  Future<void> _refreshProfile() async {
    try {
      final user = await _authRepo.getProfile();
      if (mounted) {
        await AuthController.instance.updateCurrentUser(user);
        _nameCtrl.text = user.name;
        _goalCtrl.text = user.careerGoal ?? '';
      }
    } catch (_) {
      // Silently fail — use cached data
    }
  }

  Future<void> _saveField({String? name, String? careerGoal}) async {
    setState(() => _isLoading = true);
    try {
      final updated = await _authRepo.updateProfile(
        name: name,
        careerGoal: careerGoal,
      );
      await AuthController.instance.updateCurrentUser(updated);
      if (mounted) {
        setState(() {
          _editingName = false;
          _editingGoal = false;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Update failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Log out?', style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('You will need to sign in again to access your account.',
            style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Log out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _authRepo.logout();
    } catch (_) {
      // Ignore logout API errors — clear local state anyway
    }
    await AuthController.instance.logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final user = _user;
    if (user == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Header ─────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.background,
            automaticallyImplyLeading: false,
            title: const Text('Profile'),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0D1425), Color(0xFF080C18)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 48),
                      // Avatar
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.4),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            _initials(user.name),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ).animate().scale(duration: 600.ms, curve: Curves.elasticOut),
                      const SizedBox(height: 12),
                      Text(
                        user.name,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 4),
                      Text(
                        user.email,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: AppColors.textMuted),
                      ).animate().fadeIn(delay: 300.ms),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Content ─────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Profile info section ───────────
                _SectionHeader('Profile Information'),
                const SizedBox(height: 12),

                // Name field
                _EditableField(
                  label: 'Display Name',
                  value: user.name,
                  controller: _nameCtrl,
                  isEditing: _editingName,
                  icon: Icons.person_outline_rounded,
                  isLoading: _isLoading,
                  onEdit: () => setState(() => _editingName = true),
                  onSave: () => _saveField(name: _nameCtrl.text.trim()),
                  onCancel: () {
                    setState(() {
                      _editingName = false;
                      _nameCtrl.text = user.name;
                    });
                  },
                ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 12),

                // Email (read-only)
                _ReadOnlyField(
                  label: 'Email',
                  value: user.email,
                  icon: Icons.email_outlined,
                  subtitle: 'Cannot be changed',
                ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 12),

                // Career Goal
                _EditableField(
                  label: 'Career Goal',
                  value: user.careerGoal ?? 'Not set',
                  controller: _goalCtrl,
                  isEditing: _editingGoal,
                  icon: Icons.flag_outlined,
                  isLoading: _isLoading,
                  onEdit: () => setState(() => _editingGoal = true),
                  onSave: () => _saveField(careerGoal: _goalCtrl.text.trim()),
                  onCancel: () {
                    setState(() {
                      _editingGoal = false;
                      _goalCtrl.text = user.careerGoal ?? '';
                    });
                  },
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 28),

                // ── Account section ────────────────
                _SectionHeader('Account'),
                const SizedBox(height: 12),

                // Role badge
                _ReadOnlyField(
                  label: 'Account Type',
                  value: user.role[0].toUpperCase() + user.role.substring(1),
                  icon: Icons.shield_outlined,
                ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 12),

                // Member since
                if (user.createdAt != null) ...[
                  _ReadOnlyField(
                    label: 'Member Since',
                    value: _formatDate(user.createdAt!),
                    icon: Icons.calendar_today_outlined,
                  ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),
                  const SizedBox(height: 12),
                ],

                // Change password (coming soon)
                _ActionTile(
                  icon: Icons.lock_outline_rounded,
                  label: 'Change Password',
                  subtitle: 'Coming soon',
                  color: AppColors.textMuted,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Password change coming soon'),
                        backgroundColor: AppColors.surfaceVariant,
                      ),
                    );
                  },
                ).animate().fadeIn(delay: 350.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 28),

                // ── Danger zone ─────────────────────
                _SectionHeader('Session'),
                const SizedBox(height: 12),

                _ActionTile(
                  icon: Icons.logout_rounded,
                  label: 'Log Out',
                  color: AppColors.error,
                  onTap: _logout,
                ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return iso;
    }
  }
}

// ── Section header ─────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
    );
  }
}

// ── Editable field ─────────────────────────────────────
class _EditableField extends StatelessWidget {
  final String label;
  final String value;
  final TextEditingController controller;
  final bool isEditing;
  final IconData icon;
  final bool isLoading;
  final VoidCallback onEdit;
  final VoidCallback onSave;
  final VoidCallback onCancel;

  const _EditableField({
    required this.label,
    required this.value,
    required this.controller,
    required this.isEditing,
    required this.icon,
    required this.isLoading,
    required this.onEdit,
    required this.onSave,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isEditing ? AppColors.primary : AppColors.border,
          width: isEditing ? 1.5 : 1,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          const Spacer(),
          if (!isEditing)
            GestureDetector(
              onTap: onEdit,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('Edit',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ),
        ]),
        const SizedBox(height: 8),
        if (isEditing) ...[
          TextField(
            controller: controller,
            autofocus: true,
            style: Theme.of(context).textTheme.bodyLarge,
            decoration: const InputDecoration(
              isDense: true,
              contentPadding: EdgeInsets.symmetric(vertical: 8),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
          ),
          const Divider(color: AppColors.primary),
          Row(children: [
            const Spacer(),
            TextButton(
              onPressed: isLoading ? null : onCancel,
              child: const Text('Cancel',
                  style: TextStyle(color: AppColors.textMuted)),
            ),
            const SizedBox(width: 8),
            if (isLoading)
              const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.primary))
            else
              ElevatedButton(
                onPressed: onSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  minimumSize: Size.zero,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Save',
                    style: TextStyle(color: Colors.white, fontSize: 13)),
              ),
          ]),
        ] else
          Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
      ]),
    );
  }
}

// ── Read-only field ────────────────────────────────────
class _ReadOnlyField extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final String? subtitle;

  const _ReadOnlyField({
    required this.label,
    required this.value,
    required this.icon,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 8),
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          if (subtitle != null) ...[
            const Spacer(),
            Text(subtitle!,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.textMuted, fontSize: 10)),
          ],
        ]),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context)
              .textTheme
              .bodyLarge
              ?.copyWith(color: AppColors.textSecondary),
        ),
      ]),
    );
  }
}

// ── Action tile ────────────────────────────────────────
class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(color: color, fontWeight: FontWeight.w600)),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(subtitle!,
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.textMuted)),
              ],
            ]),
          ),
          Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.6)),
        ]),
      ),
    );
  }
}
