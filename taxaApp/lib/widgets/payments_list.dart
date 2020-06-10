import 'package:flutter/material.dart';
import 'package:taxa/model/payment_model.dart';
import 'package:taxa/widgets/payment_column.dart';

class PaymentsList extends StatelessWidget {
  final List<Payment> payments;

  PaymentsList({Key key, this.payments}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: payments.length,
      itemBuilder: (context, index) {
        return InkWell(
          splashColor: Colors.greenAccent[100],
          onTap: () => {},
          child: Row(
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20.0, vertical: 10.0),
                child: PaymentColumn(
                  icon: Icons.check_circle_outline,
                  iconBackgroundColor: Colors.green[200],
                  title: payments[index].taxName,
                  subtitle: 'May tax paid on 25/05/2020',
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
