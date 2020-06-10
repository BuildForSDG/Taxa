import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:taxa/model/auth_model.dart';
import 'package:taxa/model/user_model.dart';

Future<String> login(String email, String password) async {
  // print('Username: $email, Password: $password');
  await Future.delayed(Duration(seconds: 2));
  try {
    final response = await http.post(
      'https://sdgtaxa.herokuapp.com/api/v1/auth/login',
      headers: <String, String>{
        'Content-Type': 'application/json',
      },
      body: jsonEncode(<String, String>{'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      Auth auth = Auth.fromJson(json.decode(response.body));
      final qrText = auth.qrText;
      final businessName = auth.businessName;
      final businessAddress = auth.businessAddress;
      final email = auth.email;
      final phoneNumber = auth.phoneNumber;
      final state = auth.stateName;
      final lga = auth.localGovernmentName;
      final lgaId = auth.localGovernmentId;
      final isGovernmentOfficial = auth.isGovernmentOfficial;
      final designation = auth.designation;
      final role = auth.role;
      final token = response.headers['x-auth-token'];

      SharedPreferences prefs = await SharedPreferences.getInstance();
      // set user parameters
      prefs.setString('qrText', qrText);
      prefs.setString('businessName', businessName);
      prefs.setString('businessAddress', businessAddress);
      prefs.setString('email', email);
      prefs.setString('phoneNumber', phoneNumber);
      prefs.setString('state', state);
      prefs.setString('lga', lga);
      prefs.setInt('lgaId', lgaId);
      prefs.setBool('isGovernmentOfficial', isGovernmentOfficial);
      prefs.setString('designation', designation);
      prefs.setString('role', role);
      prefs.setString('token', token);

      return null;
    } else {
      return response.body;
    }
  } catch (e) {
    return 'Something went wrong, try again';
    // return e.toString();
  }
}

Future<bool> checkLoginState() async {
  SharedPreferences sharedPreferences;
  sharedPreferences = await SharedPreferences.getInstance();
  if (sharedPreferences.getString('token') == null) {
    return false;
  }
  return true;
}

logout() async {
  SharedPreferences sharedPreferences;
  sharedPreferences = await SharedPreferences.getInstance();
  sharedPreferences.clear();
}

Future<User> createUser(String title) async {
  final http.Response response = await http.post(
    'https://sdgtaxa.herokuapp.com/api/v1/users/',
    headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: jsonEncode(<String, dynamic>{
      'email': 'onifademola@gmail.com',
      'business_name': 'Deily Computers Limited',
      'phone_number': '07032546482',
      'last_name': 'Onifade',
      'first_name': 'Ademola',
      'address': '4 Edid Lane',
      'local_government_id': 1,
      'is_government_official': false
    }),
  );
  if (response.statusCode == 201) {
    // If the server did return a 201 CREATED response,
    // then parse the JSON.
    return User.fromJson(json.decode(response.body));
  } else {
    // If the server did not return a 201 CREATED response,
    // then throw an exception.
    throw Exception('Failed to load album');
  }
}

Future<User> fetchUser() async {
  final response = await http.get(
    'https://sdgtaxa.herokuapp.com/api/v1/auth/login',
    headers: {HttpHeaders.authorizationHeader: "Basic your_api_token_here"},
  );
  final responseJson = json.decode(response.body);

  return User.fromJson(responseJson);
}
