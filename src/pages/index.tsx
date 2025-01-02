'use client'

import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useDownloadPdf } from './hooks/useDownloadPdf'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const { mutate: downloadPdf } = useDownloadPdf();
  let url = 'http://localhost:3000/about'

  // const baseUrl = window.location.origin;
  // const url = `${baseUrl}/about`;

  return (
    <div onClick={() => downloadPdf(url)}>
     Download Pdf
    </div>
  )
}
