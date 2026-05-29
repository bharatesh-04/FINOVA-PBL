"""OCR utilities for bill/receipt processing"""
import cv2
import numpy as np
from PIL import Image
import pytesseract
import re
from typing import Dict, Optional, Tuple
from datetime import datetime
import os

class OCRProcessor:
    """OCR processing for bills and receipts"""
    
    def __init__(self, tesseract_path: Optional[str] = None):
        """Initialize OCR processor"""
        if tesseract_path:
            pytesseract.pytesseract.pytesseract_cmd = tesseract_path
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR accuracy"""
        # Read image
        img = cv2.imread(image_path)
        
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        
        # Denoise
        denoised = cv2.fastNlMearsDenoising(thresh)
        
        # Rotate if needed (optional)
        # angle = self._get_rotation_angle(denoised)
        # if angle != 0:
        #     denoised = self._rotate_image(denoised, angle)
        
        return denoised
    
    def extract_text(self, image_path: str) -> str:
        """Extract text from image using Tesseract"""
        try:
            # Preprocess image
            processed_img = self.preprocess_image(image_path)
            
            # Convert to PIL Image
            pil_img = Image.fromarray(processed_img)
            
            # Extract text
            text = pytesseract.image_to_string(pil_img)
            
            return text.strip()
        except Exception as e:
            print(f"Error in text extraction: {e}")
            return ""
    
    def extract_amount(self, text: str) -> Optional[float]:
        """Extract amount/price from OCR text"""
        # Common patterns for amounts
        patterns = [
            r'(?:Total|Amount|Price|Cost|Rs|₹|€)\s*[:=]?\s*([\d,]+\.?\d*)',
            r'([\d,]+\.\d{2})\s*(?:Rs|₹|€)',
            r'(?:Total Due|Grand Total)\s*[:=]?\s*([\d,]+\.?\d*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Take the last/largest amount
                amounts = [float(m.replace(',', '')) for m in matches]
                return max(amounts)
        
        return None
    
    def extract_date(self, text: str) -> Optional[datetime]:
        """Extract date from OCR text"""
        # Common date patterns
        patterns = [
            r'(?:Date|Bill Date|Transaction Date)\s*[:=]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',  # DD/MM/YYYY or MM/DD/YYYY
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',   # YYYY/MM/DD
        ]
        
        date_formats = ['%d-%m-%Y', '%m-%d-%Y', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%Y/%m/%d']
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                for date_format in date_formats:
                    try:
                        return datetime.strptime(match, date_format)
                    except ValueError:
                        continue
        
        return None
    
    def extract_merchant(self, text: str) -> Optional[str]:
        """Extract merchant/vendor name from OCR text"""
        lines = text.split('\n')
        
        # Usually merchant name is in the first few lines
        for line in lines[:10]:
            line = line.strip()
            if len(line) > 3 and len(line) < 100:  # Reasonable merchant name length
                # Skip lines that look like amounts or dates
                if not re.match(r'^[\d\s\.,:\-/]*$', line):
                    return line
        
        return None
    
    def extract_info(self, image_path: str) -> Dict:
        """Extract all relevant information from receipt/bill"""
        text = self.extract_text(image_path)
        
        return {
            'raw_text': text,
            'amount': self.extract_amount(text),
            'date': self.extract_date(text),
            'merchant': self.extract_merchant(text),
            'confidence': 0.7  # Base confidence score
        }

# Global OCR processor instance
ocr_processor = OCRProcessor()
