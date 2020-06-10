class User {
  final String id;
  final String firstName;
  final String lastName;

  User({
    this.id, 
    this.firstName, 
    this.lastName,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      firstName: json['first_name'],
      lastName: json['last_name'],
    );
  }

}