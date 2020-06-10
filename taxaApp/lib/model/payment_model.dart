import 'dart:convert';

class Payment {
  final String id;
  final String taxId;
  final String userId;
  final String paymentChannelId;
  final DateTime paymentDate;
  final String amount;
  final String paymentMonth;
  final String paymentYear;
  final String userEmail;
  final String taxName;
  final String usersBunsinessName;
  final String paymentChannel;

  Payment({
    this.id, 
    this.taxId, 
    this.userId, 
    this.paymentChannelId,
    this.paymentDate,
    this.amount,
    this.paymentMonth,
    this.paymentYear,
    this.taxName,
    this.userEmail,
    this.usersBunsinessName,
    this.paymentChannel,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'],
      taxId: json['tax_id'].toString(),
      userId: json['user_id'],
      paymentChannelId: json['payment_channel_id'].toString(),
      paymentDate: DateTime.parse(json['payment_date']), // json['payment_date'].toString()
      amount: json['amount'],
      paymentMonth: json['payment_month'].toString(),
      paymentYear: json['payment_year'].toString(),
      taxName: json['tax_name'],
      userEmail: json['user_email'],
      usersBunsinessName: json['users_bunsiness_name'],
      paymentChannel: json['payment_channel']
    );
  }

}

// A function that converts a response body into a List<Photo>.
List<Payment> parsePayments(String responseBody) {
  final parsed = jsonDecode(responseBody).cast<Map<String, dynamic>>();

  return parsed.map<Payment>((json) => Payment.fromJson(json)).toList();
}