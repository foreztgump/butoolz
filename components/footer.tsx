import { Heart, MessageSquare } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center">
          Made with <Heart className="h-3 w-3 mx-1 text-rose-500" /> by{" "}
          <span className="font-medium ml-1">ForeztGump</span>
        </p>
        <a
          href="https://discord.gg/GxtaPQ9ntb"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Discord
        </a>
      </div>
    </footer>
  )
}
