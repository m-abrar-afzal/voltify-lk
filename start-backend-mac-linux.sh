#!/usr/bin/env bash
cd backend
npm install
[ -f .env ] || cp .env.example .env
npm run dev
