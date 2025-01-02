'use client'

import { Inter } from 'next/font/google'
import {useDownloadPdf} from './hooks/useDownloadPdf';


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
