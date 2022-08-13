#!/bin/bash

fly restart pindrop-redis

cd ./pindrop

fly deploy
