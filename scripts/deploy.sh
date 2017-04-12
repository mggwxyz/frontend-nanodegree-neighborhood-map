#!/bin/bash

## install npm modules
npm i

## create the build

gulp build

## move build files into current directory
mv dist/* .

