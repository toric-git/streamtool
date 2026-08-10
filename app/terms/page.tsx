import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { APP_NAME, DEVELOPER_TEAM } from "@/lib/app-config";

export const metadata: Metadata = {
  title: "利用規約",
  description: `${APP_NAME}の利用規約です。`,
};

export default function TermsPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="利用規約" updated="2026年8月10日">
      <section className="space-y-2">
        <h2>1. はじめに</h2>
        <p>
          本利用規約（以下「本規約」）は、{DEVELOPER_TEAM.name}
          （以下「当チーム」）が提供する「{APP_NAME}
          」（以下「本サービス」）の利用条件を定めるものです。本サービスを利用した時点で、本規約に同意したものとみなします。
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. サービス内容</h2>
        <p>
          本サービスは、配信・コラボ等で効果音を共有・再生するための Web
          アプリです。機能は予告なく追加・変更・停止することがあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2>3. アカウント</h2>
        <ul>
          <li>正確な情報で登録し、認証情報を適切に管理してください。</li>
          <li>
            表示名やアップロード内容について、利用者ご自身が責任を負うものとします。
          </li>
          <li>
            不正利用が確認された場合、アカウントや部屋の利用を制限することがあります。
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. 禁止事項</h2>
        <p>以下の行為を禁止します。</p>
        <ul>
          <li>法令または公序良俗に反する行為</li>
          <li>他者の権利（著作権・肖像権・プライバシー等）を侵害する行為</li>
          <li>過度な連打・自動化などによるサービスの妨害</li>
          <li>不正アクセス、脆弱性の悪用、リバースエンジニアリング</li>
          <li>本サービスの再配布・模倣を目的とした無断利用</li>
          <li>アダルト・差別・Harassment など配信現場に不適切な利用</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>5. コンテンツ・効果音</h2>
        <ul>
          <li>
            プリセット効果音は提供元の利用条件に従ってご利用ください。クレジット表記は開発者ページをご確認ください。
          </li>
          <li>
            利用者がアップロードした音源・画像の権利は利用者に帰属します。当チームはサービス提供に必要な範囲でこれらを処理します。
          </li>
          <li>
            権利侵害の申告があった場合、該当コンテンツの削除等を行うことがあります。
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>6. 免責</h2>
        <ul>
          <li>
            本サービスは現状有姿で提供され、特定目的への適合性を保証しません。
          </li>
          <li>
            通信障害、端末環境、OBS
            設定等に起因する不具合について、当チームは責任を負いません。
          </li>
          <li>
            本サービスの利用により生じた損害について、法令で認められる範囲を超えて責任を負いません。
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>7. 規約の変更</h2>
        <p>
          当チームは必要に応じて本規約を変更できます。変更後に本サービスを利用した場合、変更に同意したものとみなします。
        </p>
      </section>

      <section className="space-y-2">
        <h2>8. お問い合わせ</h2>
        <p>
          本規約に関するお問い合わせは、アプリ内の「ご要望・バグ報告」または開発者ページ記載の連絡手段をご利用ください。
        </p>
      </section>
    </LegalPageShell>
  );
}
