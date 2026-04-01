import Link from "next/link";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  SwatchIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
export default function PrintPage() {
  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-accent-navy-light flex items-center justify-center">
              <PrinterIcon className="w-7 h-7 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Print Materials</h1>
              <p className="text-neutral-500">
                Download worksheets and coloring pages for your lessons
              </p>
            </div>
          </div>
        </div>

        {/* Stats Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <PrinterIcon className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">-</p>
                <p className="text-sm text-neutral-500">Total Materials</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">-</p>
                <p className="text-sm text-neutral-500">Worksheets</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <SwatchIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">-</p>
                <p className="text-sm text-neutral-500">Coloring Pages</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardContent className="py-16 text-center">
            <WrenchIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              Print materials will be imported from WordPress and displayed here.
              Check back soon for worksheets and coloring pages!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
