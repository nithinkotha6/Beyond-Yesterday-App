import React from 'react';
import { fetchGangRoster } from '@/app/actions/gang';
import GangClient from './GangClient';

export default async function GangPage() {
  const initialData = await fetchGangRoster();
  return <GangClient initialData={initialData} />;
}
