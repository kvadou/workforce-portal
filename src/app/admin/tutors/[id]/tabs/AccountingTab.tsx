"use client";

import {
  CurrencyDollarIcon,
  ClockIcon,
  BookOpenIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";
import { useTutorAccounting } from "@/hooks/useTutorProfiles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/* ─── Props ─── */

interface AccountingTabProps {
  tutor: AdminTutorOverview;
}

/* ─── Main Component ─── */

export default function AccountingTab({ tutor }: AccountingTabProps) {
  const hourlyRate = tutor.baseHourlyRate ? Number(tutor.baseHourlyRate) : null;
  const totalHours = Number(tutor.totalHours);
  const estimatedEarnings = hourlyRate && totalHours ? hourlyRate * totalHours : null;

  const { data: accountingData, isLoading: accountingLoading } = useTutorAccounting(tutor.id);
  const paymentOrders = accountingData?.paymentOrders || [];

  return (
    <div className="space-y-4">
      {/* Work Summary */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <BanknotesIcon className="h-5 w-5 text-success" />
            Work Summary
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard
              icon={<CurrencyDollarIcon className="h-5 w-5 text-success" />}
              label="Hourly Rate"
              value={hourlyRate ? `$${hourlyRate.toFixed(2)}/hr` : "\u2014"}
            />
            <SummaryCard
              icon={<ClockIcon className="h-5 w-5 text-info" />}
              label="Total Hours"
              value={`${totalHours.toFixed(1)}h`}
            />
            <SummaryCard
              icon={<BookOpenIcon className="h-5 w-5 text-primary-500" />}
              label="Total Lessons"
              value={String(tutor.totalLessons)}
            />
            <SummaryCard
              icon={<BanknotesIcon className="h-5 w-5 text-success" />}
              label="Est. Earnings"
              value={estimatedEarnings ? `$${estimatedEarnings.toFixed(0)}` : "\u2014"}
              sublabel="Based on rate × hours"
            />
          </div>
        </div>
      </div>

      {/* Rate Details */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-primary-500" />
            Rate Details
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <DetailRow label="Base Hourly Rate" value={hourlyRate ? `$${hourlyRate.toFixed(2)}` : "Not set"} />
            <DetailRow
              label="Last Lesson"
              value={tutor.lastLessonDate ? new Date(tutor.lastLessonDate).toLocaleDateString() : "\u2014"}
            />
            <DetailRow
              label="Hire Date"
              value={tutor.hireDate ? new Date(tutor.hireDate).toLocaleDateString() : "\u2014"}
            />
            {tutor.branchId && (
              <DetailRow label="Branch ID" value={tutor.branchId} />
            )}
          </div>

          {tutor.tutorCruncherId && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <a
                href={`https://account.acmeworkforce.com/contractors/${tutor.tutorCruncherId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
              >
                View full accounting in TutorCruncher
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Payment Orders */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-neutral-500" />
            Payment Orders
            {paymentOrders.length > 0 && (
              <span className="text-xs text-neutral-400 font-normal">({paymentOrders.length})</span>
            )}
          </h3>
        </div>
        <div className="p-4">
          {accountingLoading ? (
            <div className="py-6"><LoadingSpinner /></div>
          ) : paymentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <DocumentTextIcon className="h-10 w-10 text-neutral-300" />
              <p className="text-xs text-neutral-400 mt-1.5">No payment orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">ID</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Date Sent</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Date Paid</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Amount</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Charges</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentOrders.map((po) => {
                    const isPaid = po.status.toLowerCase() === "paid";
                    return (
                      <tr key={po.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {po.url ? (
                            <a href={po.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              #{po.id}
                            </a>
                          ) : (
                            `#${po.id}`
                          )}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {new Date(po.date_sent).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {po.date_paid ? new Date(po.date_paid).toLocaleDateString() : "\u2014"}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-900 font-medium text-right tabular-nums">
                          ${Number(po.amount).toFixed(2)}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-500 text-right">
                          {po.charges_count}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isPaid
                              ? "bg-success-light text-success-dark"
                              : "bg-warning-light text-warning-dark"
                          }`}>
                            {isPaid && <CheckCircleIcon className="h-3 w-3" />}
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SummaryCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="p-4 bg-neutral-50 rounded-lg text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
      {sublabel && <p className="text-xs text-neutral-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}
