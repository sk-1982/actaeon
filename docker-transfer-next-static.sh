#!/bin/sh

rm -rf .next
mkdir .next

docker container cp actaeon:/app/.next/static/ .next/
