class Auth {
  final String qrText;
  final String businessName;
  final String businessAddress;
  final String email;
  final String phoneNumber;
  final String stateName;
  final String localGovernmentName;
  final int localGovernmentId;
  final bool isGovernmentOfficial;
  final String designation;
  final String role;

  Auth({
    this.qrText, 
    this.businessName, 
    this.businessAddress,
    this.email,
    this.phoneNumber,
    this.stateName,
    this.localGovernmentName,
    this.localGovernmentId,
    this.isGovernmentOfficial,
    this.designation,
    this.role,
  });

  factory Auth.fromJson(Map<String, dynamic> json) {
    return Auth(
      qrText: json['qrText'],
      businessName: json['user']['business_name'],
      businessAddress: json['user']['address'],
      email: json['user']['email'],
      phoneNumber: json['user']['phone_number'],
      stateName: json['user']['state_name'],
      localGovernmentName: json['user']['local_government_name'],
      localGovernmentId: json['user']['local_government_id'],
      isGovernmentOfficial: json['user']['is_government_official'],
      designation: json['user']['designation'],
      role: json['roles'][0],
    );
  }

}