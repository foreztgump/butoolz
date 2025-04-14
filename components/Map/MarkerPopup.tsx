import React from 'react'
// Consider using next/image if further optimization is needed
// import Image from 'next/image'

interface MarkerPopupProps {
  title: string // The marker's specific title (e.g., "1" for Bag Piece)
  popup: string // The descriptive text, potentially HTML
  img: string   // The local path to the .webp image relative to /public, or empty string
}

const MarkerPopup: React.FC<MarkerPopupProps> = ({ title, popup, img }) => {
  // The 'popup' field might contain HTML like <br>, use dangerouslySetInnerHTML
  // Be cautious if the source HTML isn't fully trusted, though in this case it is.
  const createMarkup = (htmlString: string) => {
    return { __html: htmlString };
  }

  return (
    <div className="max-w-sm p-1">
      {/* Display title if it's not just '-' */}
      {title && title !== '-' && (
        <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      )}
      
      {/* Display popup text, potentially with HTML */}
      {popup && (
         <p className="text-sm mb-2 text-center" dangerouslySetInnerHTML={createMarkup(popup)} />
      )}

      {/* Display image only if the img path is not empty */}
      {/* Temporarily commented out to test positioning */}
      {/* Re-enable image rendering */}
      {img && (
        <div className="mt-2 flex justify-center"> 
          <img 
            src={img} 
            alt={popup || title || 'Marker image'} 
            className="max-w-xs max-h-64 object-contain rounded"
            loading="lazy" 
          />
        </div>
      )}
      {/**/}
    </div>
  )
}

export default React.memo(MarkerPopup); 