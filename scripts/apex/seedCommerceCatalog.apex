
// seedCommerceCatalog.apex
System.debug('--- START SEEDING ---');

String[] catNames = new String[]{'Electronics','Mobiles','Clothing','Books','Beauty','Home','Appliances','Toys & Games','Food & Grocery','Sports & Fitness','Furniture','Automotive','Laptops & Computers','Audio','Travel & Luggage','Watches & Accessories','Personal Care','Kitchen & Dining'};

Map<String, Id> eCats = new Map<String, Id>();
for(Category__c c : [SELECT Id, Name FROM Category__c]) eCats.put(c.Name, c.Id);

List<Category__c> cIns = new List<Category__c>();
for(String c : catNames) {
    if(!eCats.containsKey(c)) cIns.add(new Category__c(Name=c, Active__c=true, Description__c='Premium '+c));
}
if(!cIns.isEmpty()) insert cIns;
for(Category__c c : cIns) eCats.put(c.Name, c.Id);

String allData = 'ELE001|4K Smart TV|Electronics#ELE002|Smart LED TV|Electronics#ELE003|Mirrorless Camera|Electronics#ELE004|DSLR Camera|Electronics#ELE005|Action Camera|Electronics#ELE006|Digital Camera|Electronics#ELE007|Home Projector|Electronics#ELE008|Streaming Device|Electronics#ELE009|Smart Display|Electronics#ELE010|Gaming Console|Electronics#ELE011|Portable Monitor|Electronics#ELE012|Digital Photo Frame|Electronics#ELE013|Media Streaming Stick|Electronics#ELE014|Smart Home Hub|Electronics#MOB001|OnePlus flagship|Mobiles#MOB002|Google Pixel|Mobiles#MOB003|Nothing Phone|Mobiles#MOB004|Motorola Edge|Mobiles#MOB005|Samsung Galaxy A|Mobiles#MOB006|Samsung Galaxy M|Mobiles#MOB007|OnePlus Nord|Mobiles#MOB008|Vivo V series|Mobiles#MOB009|Oppo Reno|Mobiles#MOB010|Realme Pro|Mobiles#MOB011|Redmi Note|Mobiles#MOB012|iQOO Neo|Mobiles#MOB013|Asus ROG|Mobiles#MOB014|Rugged Phone|Mobiles#MOB015|Foldable Phone|Mobiles#CLT001|Cotton T-Shirt|Clothing#CLT002|Oversized T-Shirt|Clothing#CLT003|Polo Shirt|Clothing#CLT004|Casual Shirt|Clothing#CLT005|Formal Shirt|Clothing#CLT006|Denim Jacket|Clothing#CLT007|Bomber Jacket|Clothing#CLT008|Casual Hoodie|Clothing#CLT009|Zip Hoodie|Clothing#CLT010|Chino Trousers|Clothing#CLT011|Slim Fit Jeans|Clothing#CLT012|Relaxed Fit Jeans|Clothing#CLT013|Track Pants|Clothing#CLT014|Cotton Shorts|Clothing#CLT015|Winter Sweatshirt|Clothing#BKS001|Clean Code|Books#BKS002|Python Guide|Books#BKS003|Psychology of Money|Books#BKS004|Algorithms Guide|Books#BKS005|Java Fundamentals|Books#BKS006|Web Dev Handbook|Books#BKS007|Database Essentials|Books#BKS008|Software Principles|Books#BKS009|AI Fundamentals|Books#BKS010|ML Basics|Books#BKS011|Cloud Computing|Books#BKS012|System Design|Books#BKS013|Cybersecurity|Books#BKS014|Product Management|Books#BKS015|Entrepreneurship|Books#BEA001|Face Serum|Beauty#BEA002|Vitamin C Serum|Beauty#BEA003|Face Cleanser|Beauty#BEA004|Foaming Cleanser|Beauty#BEA005|Skin Cream|Beauty#BEA006|Sunscreen Lotion|Beauty#BEA007|Night Cream|Beauty#BEA008|Aloe Face Gel|Beauty#BEA009|Matte Lip Color|Beauty#BEA010|Lip Balm|Beauty#BEA011|Kajal Pencil|Beauty#BEA012|Compact Powder|Beauty#BEA013|Foundation|Beauty#BEA014|Makeup Brush Set|Beauty#BEA015|Face Mask Set|Beauty#HOM001|Table Lamp|Home#HOM002|Wall Clock|Home#HOM003|Premium Bedsheet|Home#HOM004|Cushion Set|Home#HOM005|Floor Lamp|Home#HOM006|Decorative Mirror|Home#HOM007|Storage Organizer|Home#HOM008|Laundry Basket|Home#HOM009|Curtain Set|Home#HOM010|Shoe Organizer|Home#HOM011|Aroma Diffuser|Home#HOM012|Wall Shelf|Home#HOM013|Study Lamp|Home#HOM014|Alarm Clock|Home#HOM015|Storage Box|Home#APP001|Air Fryer|Appliances#APP002|Mixer Grinder|Appliances#APP003|Microwave Oven|Appliances#APP004|Electric Kettle|Appliances#APP005|Induction Cooktop|Appliances#APP006|Toaster|Appliances#APP007|Hand Blender|Appliances#APP008|Rice Cooker|Appliances#APP009|Coffee Maker|Appliances#APP010|Sandwich Maker|Appliances#APP011|Electric Iron|Appliances#APP012|Room Heater|Appliances#APP013|Air Purifier|Appliances#APP014|Robot Vacuum|Appliances#APP015|Portable Fan|Appliances#TOY001|RC Racing Car|Toys & Games#TOY002|Strategy Game|Toys & Games#TOY003|Building Blocks|Toys & Games#TOY004|Science Kit|Toys & Games#TOY005|Magnetic Tiles|Toys & Games#TOY006|Puzzle Game|Toys & Games#TOY007|Toy Kitchen Set|Toys & Games#TOY008|Toy Train Set|Toys & Games#TOY009|Doll House|Toys & Games#TOY010|STEM Kit|Toys & Games#TOY011|Action Figure|Toys & Games#TOY012|Playing Cards|Toys & Games#TOY013|Chess Board|Toys & Games#TOY014|Art & Craft Kit|Toys & Games#TOY015|Outdoor Ball Set|Toys & Games#FOD001|Basmati Rice|Food & Grocery#FOD002|Green Tea|Food & Grocery#FOD003|Coffee Beans|Food & Grocery#FOD004|Organic Honey|Food & Grocery#FOD005|Dry Fruits|Food & Grocery#FOD006|Wheat Flour|Food & Grocery#FOD007|Brown Rice|Food & Grocery#FOD008|Rolled Oats|Food & Grocery#FOD009|Peanut Butter|Food & Grocery#FOD010|Fruit Jam|Food & Grocery#FOD011|Pasta|Food & Grocery#FOD012|Pasta Sauce|Food & Grocery#FOD013|Herbal Tea|Food & Grocery#FOD014|Cooking Oil|Food & Grocery#FOD015|Breakfast Cereal|Food & Grocery#SPT001|Yoga Mat|Sports & Fitness#SPT002|Dumbbell Set|Sports & Fitness#SPT003|Resistance Band|Sports & Fitness#SPT004|Kettlebell|Sports & Fitness#SPT005|Cricket Bat|Sports & Fitness#SPT006|Cricket Ball|Sports & Fitness#SPT007|Football|Sports & Fitness#SPT008|Basketball|Sports & Fitness#SPT009|Skipping Rope|Sports & Fitness#SPT010|Fitness Gloves|Sports & Fitness#SPT011|Foam Roller|Sports & Fitness#SPT012|Gym Bag|Sports & Fitness#SPT013|Running Belt|Sports & Fitness#SPT014|Exercise Bench|Sports & Fitness#SPT015|Water Bottle|Sports & Fitness#FUR001|Office Chair|Furniture#FUR002|Study Table|Furniture#FUR003|Bedside Table|Furniture#FUR004|Bookshelf|Furniture#FUR005|Coffee Table|Furniture#FUR006|TV Unit|Furniture#FUR007|Shoe Cabinet|Furniture#FUR008|Dining Chair|Furniture#FUR009|Dining Table|Furniture#FUR010|Lounge Chair|Furniture#FUR011|Computer Desk|Furniture#FUR012|Storage Cabinet|Furniture#FUR013|Side Table|Furniture#FUR014|Wardrobe|Furniture#FUR015|Console|Furniture#AUT001|Tyre Inflator|Automotive#AUT002|Car Cleaning Kit|Automotive#AUT003|Microfiber Towels|Automotive#AUT004|Car Vacuum|Automotive#AUT005|Air Freshener|Automotive#AUT006|Dashboard Organizer|Automotive#AUT007|Seat Cover Set|Automotive#AUT008|Steering Cover|Automotive#AUT009|Car Sunshade|Automotive#AUT010|Motorcycle Cover|Automotive#AUT011|Phone Mount|Automotive#AUT012|Roadside Kit|Automotive#AUT013|Pressure Gauge|Automotive#AUT014|Boot Organizer|Automotive#AUT015|Jump Starter|Automotive#LAP001|Productivity Laptop|Laptops & Computers#LAP002|Performance Laptop|Laptops & Computers#LAP003|Ultrabook|Laptops & Computers#LAP004|Gaming Laptop|Laptops & Computers#LAP005|Student Laptop|Laptops & Computers#LAP006|Business Laptop|Laptops & Computers#LAP007|Wireless Keyboard|Laptops & Computers#LAP008|Gaming Keyboard|Laptops & Computers#LAP009|Wireless Mouse|Laptops & Computers#LAP010|Ergonomic Mouse|Laptops & Computers#LAP011|27-inch Monitor|Laptops & Computers#LAP012|24-inch Monitor|Laptops & Computers#LAP013|USB-C Dock|Laptops & Computers#LAP014|External SSD|Laptops & Computers#LAP015|Cooling Pad|Laptops & Computers#AUD001|Noise Cancelling Headphones|Audio#AUD002|Wireless Earbuds|Audio#AUD003|Bluetooth Speaker|Audio#AUD004|Party Speaker|Audio#AUD005|Studio Headphones|Audio#AUD006|Wired Earphones|Audio#AUD007|Gaming Headset|Audio#AUD008|Neckband Earphones|Audio#AUD009|Soundbar|Audio#AUD010|Compact Soundbar|Audio#AUD011|USB Microphone|Audio#AUD012|Podcast Mic|Audio#AUD013|Desktop Speakers|Audio#AUD014|Mini Speaker|Audio#AUD015|Premium Earbuds|Audio#TRV001|Cabin Backpack|Travel & Luggage#TRV002|Hardshell Carry-On|Travel & Luggage#TRV003|Canvas Duffle|Travel & Luggage#TRV004|Check-In Suitcase|Travel & Luggage#TRV005|Travel Organizer|Travel & Luggage#TRV006|Packing Cubes|Travel & Luggage#TRV007|Passport Holder|Travel & Luggage#TRV008|Toiletry Kit|Travel & Luggage#TRV009|Travel Adapter|Travel & Luggage#TRV010|Neck Pillow|Travel & Luggage#TRV011|Luggage Strap|Travel & Luggage#TRV012|Travel Wallet|Travel & Luggage#TRV013|Laptop Bag|Travel & Luggage#TRV014|Foldable Bag|Travel & Luggage#TRV015|Anti-Theft Bag|Travel & Luggage#WAT001|Analog Watch|Watches & Accessories#WAT002|Fitness Watch|Watches & Accessories#WAT003|Minimalist Watch|Watches & Accessories#WAT004|Chronograph Watch|Watches & Accessories#WAT005|Leather Watch|Watches & Accessories#WAT006|Metal Bracelet Watch|Watches & Accessories#WAT007|Digital Watch|Watches & Accessories#WAT008|Activity Watch|Watches & Accessories#WAT009|Travel Case|Watches & Accessories#WAT010|Leather Strap|Watches & Accessories#WAT011|Metal Strap|Watches & Accessories#WAT012|Casual Watch|Watches & Accessories#WAT013|Formal Watch|Watches & Accessories#WAT014|Unisex Watch|Watches & Accessories#WAT015|Dress Watch|Watches & Accessories#PER001|Electric Trimmer|Personal Care#PER002|Electric Toothbrush|Personal Care#PER003|Grooming Kit|Personal Care#PER004|Hair Dryer|Personal Care#PER005|Hair Straightener|Personal Care#PER006|Beard Trimmer|Personal Care#PER007|Body Groomer|Personal Care#PER008|Facial Steamer|Personal Care#PER009|Massage Gun|Personal Care#PER010|Foot Massager|Personal Care#PER011|Electric Shaver|Personal Care#PER012|Nose Trimmer|Personal Care#PER013|Hair Clipper|Personal Care#PER014|Travel Grooming Kit|Personal Care#PER015|Care Organizer|Personal Care#KIT001|Cookware Set|Kitchen & Dining#KIT002|Insulated Bottle|Kitchen & Dining#KIT003|Dinner Set|Kitchen & Dining#KIT004|Mug Set|Kitchen & Dining#KIT005|Glass Container Set|Kitchen & Dining#KIT006|Knife Set|Kitchen & Dining#KIT007|Chopping Board Set|Kitchen & Dining#KIT008|Spice Jar Set|Kitchen & Dining#KIT009|Lunch Box Set|Kitchen & Dining#KIT010|Serving Bowl Set|Kitchen & Dining#KIT011|Frying Pan|Kitchen & Dining#KIT012|Pressure Cooker|Kitchen & Dining#KIT013|Food Storage Set|Kitchen & Dining#KIT014|Measuring Cup Set|Kitchen & Dining#KIT015|Kitchen Organizer|Kitchen & Dining#';
String[] pArr = allData.split('#');

Map<String, Product2> eProds = new Map<String, Product2>();
for(Product2 p : [SELECT Id, ProductCode FROM Product2 WHERE ProductCode != null]) eProds.put(p.ProductCode, p);

List<Product2> pIns = new List<Product2>();
for(String s : pArr) {
    if(String.isBlank(s)) continue;
    String[] pts = s.split('\\|');
    String code = 'CH-' + pts[0];
    if(!eProds.containsKey(code)) {
        pIns.add(new Product2(ProductCode=code, Name=pts[1], Commerce_Hub_Category__c=eCats.get(pts[2]), Description='High quality '+pts[1], IsActive=true));
    }
}
if(!pIns.isEmpty()) insert pIns;
for(Product2 p : pIns) eProds.put(p.ProductCode, p);

Map<String, ProductVariant__c> eVars = new Map<String, ProductVariant__c>();
for(ProductVariant__c v : [SELECT Id, SKU__c FROM ProductVariant__c WHERE SKU__c != null]) eVars.put(v.SKU__c, v);

List<ProductVariant__c> vIns = new List<ProductVariant__c>();
for(String s : pArr) {
    if(String.isBlank(s)) continue;
    String[] pts = s.split('\\|');
    String code = 'CH-' + pts[0];
    String cat = pts[2];
    Id pId = eProds.get(code).Id;
    
    List<String[]> vDefs = new List<String[]>();
    if(cat == 'Clothing') {
        vDefs.add(new String[]{'Small Black','-SB','1000','Black','Small'});
        vDefs.add(new String[]{'Medium Blue','-MB','1000','Blue','Medium'});
    } else if(cat == 'Books') {
        vDefs.add(new String[]{'Paperback','-PB','500','','Paperback'});
        vDefs.add(new String[]{'Hardcover','-HC','800','','Hardcover'});
    } else if(cat == 'Mobiles') {
        vDefs.add(new String[]{'128GB Black','-128B','40000','Black','128GB'});
        vDefs.add(new String[]{'256GB Blue','-256L','45000','Blue','256GB'});
    } else if(cat == 'Laptops & Computers') {
        vDefs.add(new String[]{'8GB/256GB','-8256','50000','','8GB/256GB'});
        vDefs.add(new String[]{'16GB/512GB','-16512','70000','','16GB/512GB'});
    } else {
        vDefs.add(new String[]{'Standard','-STD','1500','',''});
    }
    
    for(String[] v : vDefs) {
        String sku = code + v[1];
        if(!eVars.containsKey(sku)) {
            vIns.add(new ProductVariant__c(
                SKU__c=sku, Product__c=pId, Name=v[0], Price__c=Decimal.valueOf(v[2]),
                Color__c=String.isNotBlank(v[3])?v[3]:null, Size__c=String.isNotBlank(v[4])?v[4]:null, Active__c=true
            ));
        }
    }
}
if(!vIns.isEmpty()) insert vIns;

Map<String, ProductImage__c> eImgs = new Map<String, ProductImage__c>();
for(ProductImage__c i : [SELECT Id, Product__c, Alt_Text__c FROM ProductImage__c WHERE Alt_Text__c != null]) eImgs.put(i.Product__c+'-'+i.Alt_Text__c, i);

List<ProductImage__c> iIns = new List<ProductImage__c>();
for(String s : pArr) {
    if(String.isBlank(s)) continue;
    String[] pts = s.split('\\|');
    String code = 'CH-' + pts[0];
    Id pId = eProds.get(code).Id;
    if(!eImgs.containsKey(pId+'-Front')) {
        String url = 'https://placehold.co/600x600/png?text=' + EncodingUtil.urlEncode(pts[1], 'UTF-8');
        iIns.add(new ProductImage__c(Product__c=pId, Alt_Text__c='Front', Image_URL__c=url, Display_Order__c=1, Active__c=true));
    }
}
if(!iIns.isEmpty()) insert iIns;

System.debug('--- SEEDING COMPLETE ---');
