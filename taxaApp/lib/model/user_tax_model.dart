class UserTax {
  final String id;
  final String name;
  final String total;
  final String description;
  final String localGovernmentId;

  UserTax({
    this.id, 
    this.name, 
    this.total, 
    this.description, 
    this.localGovernmentId,
  });

  factory UserTax.fromJson(Map<String, dynamic> json) {
    return UserTax(
      id: json['id'].toString(),
      name: json['name'],
      total: json['total'],
      description: json['description'],
      localGovernmentId: json['local_government_id'].toString(),
    );
  }

}