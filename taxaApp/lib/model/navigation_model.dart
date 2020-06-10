import 'package:flutter/material.dart';

class NavigationModel {
  String title;
  IconData icon;

  NavigationModel({this.title, this.icon});
}

List<NavigationModel> navigationItems = [
  NavigationModel(
      title: "Scan QR",
      icon: Icons.zoom_in
  ),
  NavigationModel(
      title: "Profile",
      icon: Icons.person
  ),
  // NavigationModel(
  //     title: "Settings",
  //     icon: Icons.settings_applications
  // ),
  NavigationModel(
      title: "Log Out",
      icon: Icons.lock
  ),
];
