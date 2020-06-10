import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:taxa/model/user_tax_model.dart';

Future<UserTax> fetchUserTax() async {
  SharedPreferences sharedPreferences = await SharedPreferences.getInstance();
  final _authToken = sharedPreferences.getString('token');
  final _lgaId = sharedPreferences.getInt('lgaId');
  final response = await http.get(
    'https://sdgtaxa.herokuapp.com/api/v1/taxes/foruser/$_lgaId',
    headers: <String, String>{
      'Content-Type': 'application/json',
      'X-Auth-Token': _authToken,
    },
  );

  final responseJson = json.decode(response.body);
  print(responseJson);
  return UserTax.fromJson(responseJson);
}