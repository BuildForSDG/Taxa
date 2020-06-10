import 'package:flutter/material.dart';
import 'package:flutter_login/flutter_login.dart';
import 'package:taxa/screens/home_screen.dart';
import 'package:taxa/services/auth_service.dart';

const users = const {
  'taxa@gmail.com': '123456',
  'taxa2@gmail.com': '654321',
};

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  @override
  void initState() {
    super.initState();
    checkLoginState().then((status) {
        if (status) {
          Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (BuildContext context) => HomeScreen()),
              (Route<dynamic> route) => false);
        }
    });
  }

  Duration get loginTime => Duration(milliseconds: 2250);

  Future<String> _authUser(LoginData data) {
    return Future.delayed(loginTime).then((_) {
      return login(data.name, data.password).then((msg) {
        return msg;
      });
    });
  }

  Future<String> _signUpUser(LoginData data) {
    return Future.delayed(loginTime).then((_) {
      return 'Proceed to your L.G.A. for signup';
    });
  }

  Future<String> _recoverPassword(String name) {
    print('Name: $name');
    return Future.delayed(loginTime).then((_) {
      if (!users.containsKey(name)) {
        return 'Username not exists';
      }
      return null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return FlutterLogin(
      title: 'TAXA',
      logo: 'assets/images/logo.png',
      onLogin: _authUser,
      onSignup: _signUpUser,
      onSubmitAnimationCompleted: () {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (context) => HomeScreen(),
        ));
      },
      onRecoverPassword: _recoverPassword,
    );
  }
}
