/** Stamps the dashboard and library versions from the last compute response's meta. */

import type { ResponseMeta } from "../api/types";

interface Props {
  meta: ResponseMeta | null;
}

export default function ProvenanceFooter({ meta }: Props) {
  if (!meta) return null;
  return (
    <footer className="provenance">
      Results produced by <code>oncothresh {meta.oncothresh_version}</code> via{" "}
      <code>oncothresh-web {meta.oncothresh_web_version}</code>. Cite the library as the computational
      artifact.
    </footer>
  );
}
