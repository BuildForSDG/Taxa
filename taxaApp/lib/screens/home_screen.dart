import 'package:flutter/material.dart';
import 'package:gradient_app_bar/gradient_app_bar.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:taxa/commons/collapsing_navigation_drawer_widget.dart';
import 'package:taxa/model/payment_model.dart';
import 'package:taxa/screens/login_screen.dart';
import 'package:taxa/screens/pay_tax_screen.dart';
import 'package:taxa/services/payment_service.dart';
import 'package:taxa/theme/colors/light_colors.dart';
import 'package:taxa/widgets/payments_list.dart';
import 'package:taxa/widgets/top_container.dart';
import 'package:taxa/services/auth_service.dart';

class HomeScreen extends StatefulWidget {
  static CircleAvatar calendarIcon() {
    return CircleAvatar(
      radius: 25.0,
      backgroundColor: LightColors.kGreen,
      child: Icon(
        Icons.calendar_today,
        size: 20.0,
        color: Colors.white,
      ),
    );
  }

  static CircleAvatar addPayIcon() {
    return CircleAvatar(
      radius: 25.0,
      backgroundColor: LightColors.kGreen,
      child: Icon(
        Icons.add_circle_outline,
        size: 20.0,
        color: Colors.white,
      ),
    );
  }

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _businessName = '';
  String _businessAddress = '';
  Future<List<Payment>> payments;
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      new GlobalKey<RefreshIndicatorState>();
  @override
  void initState() {
    super.initState();
    checkLoginState().then((status) {
      if (!status) {
        Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (BuildContext context) => LoginScreen()),
            (Route<dynamic> route) => false);
      }
    });

    // WidgetsBinding.instance
    //   .addPostFrameCallback((_) => _refreshIndicatorKey.currentState.show());
    
    _loadCounter();
    
    // payments = fetchPaymentsByUserSample();
    payments = fetchPaymentsByUser();
  }

  _loadCounter() async {
    SharedPreferences sharedPreferences = await SharedPreferences.getInstance();
    setState(() {
      _businessName = (sharedPreferences.getString('businessName'));
      _businessAddress = (sharedPreferences.getString('businessAddress'));
    });
  }

  Future<Null> _refresh() {
    return fetchPaymentsByUser().then((payments) {
      setState(() => payments = payments);
    });
  }

  Text subheading(String title) {
    return Text(
      title,
      style: TextStyle(
          color: LightColors.kDarkBlue,
          fontSize: 20.0,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2),
    );
  }

  @override
  Widget build(BuildContext context) {
    double width = MediaQuery.of(context).size.width;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: GradientAppBar(
        centerTitle: true,
        title: Text('Taxa'),
        backgroundColorStart: Colors.green,
        backgroundColorEnd: Colors.greenAccent,
        brightness: Brightness.light,
        actions: <Widget>[
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: TaxSearch(),
              );
            },
          ),
        ],
        elevation: 0.0,
      ),
      drawer: CollapsingNavigationDrawer(),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            TopContainer(
              height: 140,
              width: width,
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 0, vertical: 0.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: <Widget>[
                          CircularPercentIndicator(
                            radius: 90.0,
                            lineWidth: 5.0,
                            animation: true,
                            percent: 0.75,
                            circularStrokeCap: CircularStrokeCap.round,
                            progressColor: Colors.greenAccent[100],
                            backgroundColor: Colors.green,
                            center: CircleAvatar(
                              backgroundColor: LightColors.kBlue,
                              radius: 35.0,
                              backgroundImage:
                                  AssetImage('assets/images/avatar.png'),
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: <Widget>[
                              Container(
                                child: Text(
                                  '$_businessName',
                                  textAlign: TextAlign.start,
                                  style: TextStyle(
                                    fontSize: 22.0,
                                    color: LightColors.kDarkBlue,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Container(
                                child: Text(
                                  '$_businessAddress',
                                  textAlign: TextAlign.start,
                                  style: TextStyle(
                                    fontSize: 16.0,
                                    color: Colors.black45,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    )
                  ]),
              padding:
                  const EdgeInsets.symmetric(horizontal: 2.0, vertical: 1.0),
            ),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20.0, vertical: 3.0),
              child: Column(
                children: <Widget>[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: <Widget>[
                      subheading('Recent Payments'),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) => PayTaxScreen()),
                          );
                        },
                        child: HomeScreen.addPayIcon(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 15.0),
            Expanded(
              child: SingleChildScrollView(
                child: SizedBox(
                  height: 600,
                  child: RefreshIndicator(
                    key: _refreshIndicatorKey,
                    onRefresh: _refresh,
                    child: FutureBuilder<List<Payment>>(
                      future: payments,
                      builder: (context, snapshot) {
                        if (snapshot.hasError) print(snapshot.error);

                        return snapshot.hasData
                            ? PaymentsList(payments: snapshot.data)
                            : Center(child: Text('No record found'));
                            // : Center(child: CircularProgressIndicator());
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TaxSearch extends SearchDelegate<String> {
  final myTaxes = [
    '364578767898',
    '485967898789',
    '567898767876',
    '998856756787',
    '352859609706'
  ];

  final myRecentTaxes = ['364578767898', '485967898789', '567898767876'];

  @override
  List<Widget> buildActions(BuildContext context) {
    // actions for app bar
    return [
      IconButton(
          icon: Icon(Icons.clear),
          onPressed: () {
            query = '';
          })
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    // leading icon on the left of the app bar
    return IconButton(
        icon: AnimatedIcon(
            icon: AnimatedIcons.menu_arrow, progress: transitionAnimation),
        onPressed: () {
          close(context, null);
        });
  }

  @override
  Widget buildResults(BuildContext context) {
    // show some result base on the selection
    // return null;
    return Center(
      child: Container(
          height: 100.0,
          width: 100.0,
          child: Card(color: Colors.red, child: Center(child: Text(query)))),
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    // show when someone searches for something
    final suggestionList = query.isEmpty
        ? myRecentTaxes
        : myTaxes.where((p) => p.startsWith(query)).toList();

    return ListView.builder(
      itemBuilder: (context, index) => ListTile(
          onTap: () {
            showResults(context);
          },
          leading: Icon(Icons.credit_card),
          title: RichText(
              text: TextSpan(
                  text: suggestionList[index].substring(0, query.length),
                  style: TextStyle(
                      color: Colors.blue, fontWeight: FontWeight.bold),
                  children: [
                TextSpan(
                    text: suggestionList[index].substring(query.length),
                    style: TextStyle(
                        color: Colors.grey, fontWeight: FontWeight.normal))
              ]))),
      itemCount: suggestionList.length,
    );
  }
}

class DrawerListTile extends StatelessWidget {
  final IconData icon;
  final String text;
  final Function onTap;

  DrawerListTile(this.icon, this.text, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8.0, 0, 8.0, 0),
      child: Container(
        decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey.shade400))),
        child: InkWell(
          splashColor: Colors.greenAccent,
          onTap: onTap,
          child: Container(
            height: 50,
            child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Icon(icon),
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Text(text,
                            style: TextStyle(
                              fontSize: 16.0,
                            )),
                      ),
                    ],
                  ),
                  Icon(Icons.arrow_right),
                ]),
          ),
        ),
      ),
    );
  }
}
