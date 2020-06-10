import 'dart:math' as math;

import 'package:gradient_app_bar/gradient_app_bar.dart';
import 'package:taxa/model/user_tax_model.dart';
import 'package:taxa/services/user_tax_service.dart';
import 'package:taxa/widgets/card_back.dart';
import 'package:taxa/widgets/card_front.dart';
import 'package:flutter/material.dart';
import 'package:taxa/widgets/top_container.dart';

class PayTaxScreen extends StatefulWidget {
  @override
  _PayTaxScreenState createState() => _PayTaxScreenState();
}

class _PayTaxScreenState extends State<PayTaxScreen>
  with SingleTickerProviderStateMixin {
  // double _rotationFactor = 0;
  AnimationController _flipAnimationController;
  Animation<double> _flipAnimation;
  TextEditingController _cardNumberController,
      _cardHolderNameController,
      _cardExpiryController,
      _cvvController;
  FocusNode _cvvFocusNode;
  String _cardNumber = '';
  String _cardHolderName = '';
  String _cardExpiry = '';
  String _cvvNumber = '';

  Future<UserTax> _tax;

  _PayTaxScreenState() {
    _cardNumberController = TextEditingController();
    _cardHolderNameController = TextEditingController();
    _cardExpiryController = TextEditingController();
    _cvvController = TextEditingController();
    _cvvFocusNode = FocusNode();

    _cardNumberController.addListener(onCardNumberChange);
    _cardHolderNameController.addListener(() {
      _cardHolderName = _cardHolderNameController.text;
      setState(() {});
    });
    _cardExpiryController.addListener(() {
      _cardExpiry = _cardExpiryController.text;
      setState(() {});
    });
    _cvvController.addListener(() {
      _cvvNumber = _cvvController.text;
      setState(() {});
    });

    _cvvFocusNode.addListener(() {
      _cvvFocusNode.hasFocus
          ? _flipAnimationController.forward()
          : _flipAnimationController.reverse();
    });
  }

  @override
  void initState() {
    super.initState();
    _flipAnimationController =
        AnimationController(vsync: this, duration: Duration(milliseconds: 350));
    _flipAnimation =
        Tween<double>(begin: 0, end: 1).animate(_flipAnimationController)
          ..addListener(() {
            setState(() {});
          });
//    _flipAnimationController.forward();

    _tax = fetchUserTax();
  }

  void onCardNumberChange() {
    _cardNumber = _cardNumberController.text;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    double width = MediaQuery.of(context).size.width;
    return Scaffold(
      appBar: GradientAppBar(
        centerTitle: true,
        title: Text('Pay Tax'),
        backgroundColorStart: Colors.green,
        backgroundColorEnd: Colors.greenAccent,
        elevation: 0.0,
      ),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            TopContainer(
              height: null,
              width: width,
              child: Center(
                child: Column(
                  children: <Widget>[
                    Transform(
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001)
                        ..rotateY(math.pi * _flipAnimation.value),
                      origin: Offset(MediaQuery.of(context).size.width / 2, 0),
                      child: _flipAnimation.value < 0.5
                          ? FutureBuilder<UserTax>(
                            future: _tax,
                            builder: (context, snapshot) {
                              if (snapshot.hasData) {
                                CardFrontView(
                                  cardNumber: _cardNumber,
                                  cardHolderName: _cardHolderName,
                                  cardExpiry: _cardExpiry,
                                  taxAmount: snapshot.data.total,
                                );
                              } else if (snapshot.hasError) {
                                return CardFrontView(
                                  cardNumber: _cardNumber,
                                  cardHolderName: _cardHolderName,
                                  cardExpiry: _cardExpiry,
                                  taxAmount: '---',
                                );
                              }

                              // By default, show a loading spinner.
                              return CardFrontView(
                                  cardNumber: _cardNumber,
                                  cardHolderName: _cardHolderName,
                                  cardExpiry: _cardExpiry,
                                  taxAmount: '---',
                                );
                            },
                            
                          )
                          : CardBackView(
                              cvvNumber: _cvvNumber,
                            ),
                    ),
                  ],
                ),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 5.0, vertical: 1.0),
            ),
            Expanded(
              flex: 1,
              child: Container(
                padding: EdgeInsets.all(16),
                height: double.infinity,
                child: SingleChildScrollView(
                  child: Column(
                    children: <Widget>[
//                      Slider(
//                        onChanged: (double value) {
//                          setState(() {
//                            _rotationFactor = value;
//                          });
//                        },
//                        value: _rotationFactor,
//                      ),
                      TextField(
                        controller: _cardNumberController,
                        maxLength: 16,
                        decoration: InputDecoration(
                          hintText: 'Card Number',
                        ),
                      ),
                      TextField(
                        controller: _cardHolderNameController,
                        maxLength: 50,
                        decoration: InputDecoration(
                          hintText: 'Card Holder Name',
                        ),
                      ),
                      Row(
                        children: <Widget>[
                          Expanded(
                            flex: 2,
                            child: TextField(
                              controller: _cardExpiryController,
                              maxLength: 5,
                              decoration: InputDecoration(
                                  counterText: '', hintText: 'Expiry Date'),
                            ),
                          ),
                          SizedBox(width: 16),
                          Expanded(
                            flex: 1,
                            child: TextField(
                              focusNode: _cvvFocusNode,
                              controller: _cvvController,
                              maxLength: 3,
                              decoration: InputDecoration(
                                  counterText: '', hintText: 'CVV'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Container(
              height: 80,
              width: width,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Container(
                    child: Text(
                      'Pay Now',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 18),
                    ),
                    alignment: Alignment.center,
                    margin: EdgeInsets.fromLTRB(20, 10, 20, 20),
                    width: width - 40,
                    decoration: BoxDecoration(
                      // color: Colors.green,
                      gradient: LinearGradient(
                          colors: <Color>[Colors.green, Colors.greenAccent]),
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
