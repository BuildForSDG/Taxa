import 'package:flutter/material.dart';

class CardFrontView extends StatelessWidget {
  final String cardNumber;
  final String cardHolderName;
  final String cardExpiry;
  final String taxAmount;

  String _formattedCardNumber;
  String _formattedExpiryDate;

  CardFrontView(
      {Key key, this.cardNumber, this.cardHolderName, this.cardExpiry, this.taxAmount})
      : super(key: key) {
    _formattedCardNumber = this.cardNumber.padRight(16, '*');
    _formattedCardNumber = _formattedCardNumber.replaceAllMapped(
        RegExp(r".{4}"), (match) => "${match.group(0)} ");

    _formattedExpiryDate = this
        .cardExpiry
        .replaceAllMapped(RegExp(r".{2}"), (match) => "${match.group(0)}/");
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 500,
      height: 300,
      child: Card(
        color: Colors.white70,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 8,
        margin: EdgeInsets.all(16),
        child: Padding(
          padding: const EdgeInsets.all(25),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                      flex: 2,
                      child: Text(
                        'N$taxAmount',
                        style: TextStyle(
                          fontSize: 22.0,
                          fontWeight: FontWeight.w800,
                        ),
                      )),
                  SizedBox(
                    width: 30,
                  ),
                  Expanded(
                      flex: 1,
                      child: Image.asset('assets/images/visa.png')),
                ],
              ),
              SizedBox(
                height: 32,
              ),
              Text(
                _formattedCardNumber,
                style: TextStyle(
                  fontSize: 21,
                  fontFamily: 'Roboto',
                  letterSpacing: 2,
                  wordSpacing: 2,
                  fontWeight: FontWeight.w500,
                  shadows: [
                    Shadow(color: Colors.black12, offset: Offset(2, 1))
                  ],
                ),
              ),
              SizedBox(
                height: 32,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text('Card Holder'),
                        Text(
                          cardHolderName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              letterSpacing: 2,
                              fontSize: 20,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('Expiry'),
                      Text(
                        _formattedExpiryDate,
                        style: TextStyle(
                            letterSpacing: 2,
                            fontSize: 20,
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
