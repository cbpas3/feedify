import { redirect } from 'next/navigation'

// The /process route has been replaced by the modal-based SourceInput
// on the feed page. Redirect any existing bookmarks or links here.
export default function ProcessPage() {
  redirect('/')
}
