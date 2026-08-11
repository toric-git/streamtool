type Props = {
  /** Room settings use "この部屋"; marketing pages use a generic intro. */
  context?: "room" | "marketing";
  /** When false, omit the inner heading (parent section already has one). */
  showHeading?: boolean;
  className?: string;
};

export function ObsUsageGuide({
  context = "room",
  showHeading = true,
  className,
}: Props) {
  const intro =
    context === "marketing"
      ? "サウンドボードをブラウザで再生し、OBSのアプリケーション音声キャプチャで取り込みます。専用URLやトークンは不要です。"
      : "この部屋のボードをブラウザで再生し、OBSのアプリケーション音声キャプチャで取り込みます。専用URLやトークンは不要です。";

  const openBoardStep =
    context === "marketing"
      ? "配信に使うPCでサウンドボード（部屋）を開き、音が出る状態にしておきます（必要なら一度テスト再生）。"
      : "配信に使うPCでこの部屋のサウンドボードを開き、音が出る状態にしておきます（必要なら一度テスト再生）。";

  return (
    <section className={className ?? "space-y-4 rounded-xl border p-4"}>
      <div>
        {showHeading && (
          <h2 className="text-lg font-semibold">OBSでの使い方</h2>
        )}
        <p
          className={`text-sm text-muted-foreground ${showHeading ? "" : "font-semibold"}`}
        >
          {intro}
        </p>
      </div>

      <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
        <li>{openBoardStep}</li>
        <li>
          OBSで「ソース」→「アプリケーション音声キャプチャ（NEW）」を追加します。
        </li>
        <li>
          キャプチャ対象に、ボードを開いているブラウザ（Chrome / Edge など）を選びます。
        </li>
        <li>
          ボードで効果音を再生し、OBSのミキサーで音量を調整します。
        </li>
      </ol>

      <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="font-medium">ポイント</p>
        <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
          <li>
            ブラウザの音をそのまま配信に乗せるため、ボタンを押した瞬間の遅延が小さくなります。
          </li>
          <li>
            同じPCのマイクや他アプリの音と混ざらないよう、キャプチャ対象はボード用ブラウザに限定してください。
          </li>
          <li>
            Windows では「アプリケーション音声キャプチャ」が使えます。古いOBSではアップデートが必要な場合があります。
          </li>
          <li>
            コラボ相手の音も配信に乗せたい場合は、相手にも部屋へ参加してもらい、このPCのボードで再生される音をキャプチャします。
          </li>
        </ul>
      </div>
    </section>
  );
}
