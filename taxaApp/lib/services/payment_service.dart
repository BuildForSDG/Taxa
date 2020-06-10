import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:taxa/model/payment_model.dart';

/* 
  * Get payments by a user 
*/
Future<List<Payment>> fetchPaymentsByUser() async {
  SharedPreferences sharedPreferences = await SharedPreferences.getInstance();
  final authToken = sharedPreferences.getString('token');
  final code = sharedPreferences.getString('qrText');
  var params = {
                'code': code
                };
  Uri uri = Uri.parse("https://sdgtaxa.herokuapp.com/api/v1/users/payment/history");
  uri.replace(queryParameters: params);
  final response = await http.get(
    uri,
    headers: <String, String>{
      'Content-Type': 'application/json',
      'X-Auth-Token': authToken,
    },
  );
  
  // Map<String, dynamic> responseJson = json.decode(response.body);
  // return Payment.fromJson(responseJson);

  // Use the compute function to run parsePhotos in a separate isolate.
  return compute(parsePayments, response.body);

  
}

Future<String> _loadPaymentSampleData() async {
  return await rootBundle.loadString('assets/data/payments.json');
}

/* 
  * Get payments by a user 
*/
Future<List<Payment>> fetchPaymentsByUserSample() async {
  String data = await _loadPaymentSampleData();
  
  return compute(parsePayments, data);
}
