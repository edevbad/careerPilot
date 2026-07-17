import 'dart:convert';

class UserModel {
  final String id;
  final String name;
  final String email;
  final String? careerGoal;
  final String role;
  final String? createdAt;
  final String? updatedAt;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.careerGoal,
    required this.role,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      careerGoal: json['careerGoal'] as String?,
      role: json['role'] as String? ?? 'user',
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'careerGoal': careerGoal,
        'role': role,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  String toJsonString() => jsonEncode(toJson());

  static UserModel fromJsonString(String json) =>
      UserModel.fromJson(jsonDecode(json) as Map<String, dynamic>);

  UserModel copyWith({String? name, String? careerGoal}) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email,
      careerGoal: careerGoal ?? this.careerGoal,
      role: role,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
