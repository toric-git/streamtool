import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { APP_NAME, DEVELOPER_TEAM } from "@/lib/app-config";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${APP_NAME}のプライバシーポリシーです。`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="プライバシーポリシー"
      updated="2026年8月10日"
    >
      <section className="space-y-2">
        <h2>1. 基本方針</h2>
        <p>
          {DEVELOPER_TEAM.name}
          （以下「当チーム」）は、「{APP_NAME}
          」（以下「本サービス」）における利用者情報の取扱いについて、以下のとおり定めます。
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. 取得する情報</h2>
        <ul>
          <li>アカウント情報（メールアドレス、認証に必要な情報）</li>
          <li>プロフィール（表示名など利用者が入力した情報）</li>
          <li>
            利用データ（部屋への参加、効果音の再生イベント、設定内容など）
          </li>
          <li>
            アップロードされた音声・画像ファイルおよびそれに付随するメタデータ
          </li>
          <li>
            お問い合わせ内容（ご要望・バグ報告、任意の連絡先、ページ URL、User-Agent
            等）
          </li>
          <li>
            技術情報（IP
            アドレスのハッシュ、Cookie、端末・ブラウザ情報など、サービス安定運用に必要な範囲）
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>3. 利用目的</h2>
        <ul>
          <li>本サービスの提供・維持・改善</li>
          <li>不正利用の防止、セキュリティ確保</li>
          <li>お問い合わせ対応</li>
          <li>重要なお知らせの通知（必要な場合）</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. 第三者提供・委託</h2>
        <p>
          当チームは、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。ただし、ホスティング・認証・データベース等の外部サービス（例:
          Supabase、Vercel）に、本サービスの運営に必要な範囲で処理を委託することがあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. Cookie 等</h2>
        <p>
          ログイン状態の維持など、サービス提供に必要な Cookie
          を使用します。ブラウザ設定により Cookie
          を無効化できますが、一部機能が利用できなくなる場合があります。
        </p>
      </section>

      <section className="space-y-2">
        <h2>6. 保管・安全管理</h2>
        <p>
          取得した情報は、サービス提供に必要な期間保管し、漏えい・滅失・毀損の防止に努めます。アカウント削除や部屋削除に伴い、関連データを削除または匿名化することがあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. 未成年の利用</h2>
        <p>
          保護者の同意のもとでご利用ください。不同意が確認できた場合、利用を制限することがあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2>8. 開示・訂正・削除</h2>
        <p>
          ご本人からの開示・訂正・削除等のご請求には、合理的な範囲で対応します。アプリ内の「ご要望・バグ報告」からご連絡ください。
        </p>
      </section>

      <section className="space-y-2">
        <h2>9. 改定</h2>
        <p>
          本ポリシーは必要に応じて改定します。重要な変更がある場合は、本サービス上で周知します。
        </p>
      </section>
    </LegalPageShell>
  );
}
