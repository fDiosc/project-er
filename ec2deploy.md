# AWS EC2 Deployment Guide for ER Review System

This guide provides comprehensive instructions to deploy the ER Review System to an existing AWS EC2 instance using Amazon Linux 2023.

## Prerequisites

- AWS Account with EC2 access
- AWS CLI installed locally (optional but recommended)
- SSH key pair for EC2 access

## Part 1: Using Your Existing EC2 Instance

From the screenshot, I can see you have an existing Amazon Linux 2023 instance. We'll use this instance for deployment.

### 1.1 Verify Security Group Configuration

Ensure your security group allows the following inbound rules:
- **SSH (22)** - Your IP only (for secure access)
- **HTTP (80)** - 0.0.0.0/0 (for web access)
- **Custom TCP (3000)** - 0.0.0.0/0 (for direct Node.js access)

### 1.2 Connect to Your Instance

```bash
# Replace with your key file and the public IP from your instance
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR-EC2-PUBLIC-IP
```

**Note**: Amazon Linux uses `ec2-user` as the default user, not `ubuntu`.

## Part 2: Server Environment Setup

### 2.1 Update System and Install Dependencies

```bash
# Update system packages
sudo yum update -y

# Install essential packages
sudo yum install -y curl wget git unzip

# Install Node.js 20.x (LTS) or 22.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installations
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x or higher
```

### 2.2 Install PostgreSQL

```bash
# Install PostgreSQL
sudo yum install -y postgresql15-server postgresql15

# Initialize the database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb er_review_prod
sudo -u postgres psql -c "CREATE USER er_user WITH PASSWORD 'your_secure_password_here';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE er_review_prod TO er_user;"
sudo -u postgres psql -c "ALTER USER er_user CREATEDB;"

# Configure PostgreSQL authentication
sudo nano /var/lib/pgsql/data/pg_hba.conf
# Find the line that starts with "local all all" and change "ident" to "md5"
# Example: local   all   all   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2.3 Install Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Part 3: Application Deployment

### 3.1 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www
sudo chown -R ec2-user:ec2-user /var/www
cd /var/www

# Clone your repository (replace with your actual repo)
git clone https://github.com/your-username/er-review.git
cd er-review

# Install dependencies
npm install

# Install Prisma CLI if not already installed
npm install -g prisma

### 3.1.1 Update Prisma for PostgreSQL
IMPORTANT: The default configuration uses SQLite. You must update it for PostgreSQL.

1. Open `prisma/schema.prisma`:
   ```bash
   nano prisma/schema.prisma
   ```

2. Change the provider from `sqlite` to `postgresql`:
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql" // change from "sqlite"
     url      = env("DATABASE_URL") // change from "file:./dev.db" if needed, though env() is better
   }
   ```
   *Note: Ensure the `url` is set to `env("DATABASE_URL")`.*
```

### 3.2 Environment Configuration

```bash
# Create production environment file
# Create production environment file from example
cp .env.example .env
nano .env
```

**Set the following environment variables:**

```bash
# Database Configuration
DATABASE_URL="postgresql://er_user:your_secure_password_here@localhost:5432/er_review_prod"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Next.js Configuration
NODE_ENV="production"

# Optional: If using external APIs
# API_BASE_URL="https://your-api.com"
```

### 3.3 Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: Seed database with initial data
# npx prisma db seed
```

### 3.4 Build Application

```bash
# Build the Next.js application
npm run build

# Test that the build was successful
npm start
# Press Ctrl+C to stop after confirming it works
```

### 3.5 PM2 Configuration

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

**ecosystem.config.js content:**

```javascript
module.exports = {
  apps: [{
    name: 'er-review',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/er-review',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/er-review-error.log',
    out_file: '/var/log/er-review-out.log',
    log_file: '/var/log/er-review-combined.log',
    time: true
  }]
}
```

### 3.6 Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
pm2 logs er-review
```

## Part 4: Nginx Reverse Proxy Setup

### 4.1 Install and Configure Nginx

```bash
# Install Nginx
sudo yum install -y nginx

# Create configuration directory if it doesn't exist
sudo mkdir -p /etc/nginx/conf.d

# Create new configuration
sudo nano /etc/nginx/conf.d/er-review.conf
```

**Nginx configuration (`/etc/nginx/conf.d/er-review.conf`):**

```nginx
server {
    listen 80;
    server_name YOUR-EC2-PUBLIC-IP;  # Replace with your actual EC2 public IP
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files optimization
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 4.2 Enable and Start Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## Part 5: Testing Your Deployment

## Part 6: Monitoring and Maintenance

### 6.1 Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/er-review
```

**Logrotate configuration:**

```
/var/log/er-review*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 0644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 6.2 Monitoring Commands

```bash
# Application status
pm2 status
pm2 logs er-review
pm2 monit

# System resources
htop
df -h
free -h

# Database status
sudo systemctl status postgresql

# Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check application logs
tail -f /var/log/er-review-combined.log

# Database connection test
psql postgresql://er_user:your_password@localhost:5432/er_review_prod -c "SELECT 1;"
```

## Part 7: Security Hardening

### 7.1 Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (adjust port if you changed it)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

### 7.2 Security Updates

```bash
# Enable automatic security updates
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

## Part 8: Deployment Script

Create a deployment script for easy updates:

```bash
nano /home/ec2-user/deploy.sh
chmod +x /home/ec2-user/deploy.sh
```

**deploy.sh content:**

```bash
#!/bin/bash

# ER Review Deployment Script
set -e

APP_DIR="/var/www/er-review"
BACKUP_DIR="/home/ec2-user/backups"

echo "🚀 Starting deployment..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "📦 Backing up database..."
pg_dump postgresql://er_user:your_password@localhost:5432/er_review_prod > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📚 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Restart application
echo "🔄 Restarting application..."
pm2 restart er-review

# Wait for app to start
sleep 5

# Check application status
echo "✅ Checking application status..."
pm2 status er-review

echo "🎉 Deployment completed successfully!"
```

## Part 9: Testing Deployment

### 9.1 Health Checks

```bash
# Test application directly
curl http://localhost:3000

# Test through Nginx (replace with your actual EC2 public IP)
curl http://YOUR-EC2-PUBLIC-IP

# Check database connection
psql postgresql://er_user:your_password@localhost:5432/er_review_prod -c "SELECT COUNT(*) FROM \"ER\";"
```

### 9.2 Performance Testing

```bash
# Install Apache Bench (optional)
sudo apt install -y apache2-utils

# Basic load test
ab -n 100 -c 10 http://your-domain.com/
```

## Part 10: Troubleshooting

### 10.1 Common Issues

**Application won't start:**
```bash
# Check PM2 logs
pm2 logs er-review

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart er-review
```

**Database connection issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql postgresql://er_user:your_password@localhost:5432/er_review_prod

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**Nginx issues:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### 10.2 Performance Optimization

```bash
# Enable Node.js production optimizations
export NODE_ENV=production

# Increase PM2 instances (for larger instances)
pm2 scale er-review 2

# Monitor memory usage
pm2 monit
```

## Part 11: Backup and Recovery

### 11.1 Automated Backups

```bash
# Create backup script
nano /home/ubuntu/backup.sh
chmod +x /home/ubuntu/backup.sh
```

**backup.sh content:**

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump postgresql://er_user:your_password@localhost:5432/er_review_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www er-review

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Setup cron job for daily backups:**

```bash
crontab -e
# Add this line for daily backup at 2 AM
0 2 * * * /home/ubuntu/backup.sh >> /var/log/backup.log 2>&1
```

## Access Information

Once deployed, your ER Review System will be available at:

- **URL**: `http://your-domain.com` or `http://YOUR-EC2-PUBLIC-IP`
- **Login Credentials**:
  - Admin: `admin` / `admin123`
  - Reviewer: `reviewer` / `review123`

## Maintenance Schedule

- **Daily**: Automated backups
- **Weekly**: Check system resources and logs
- **Monthly**: Update system packages and review security
- **Quarterly**: Review and update application dependencies

---

## Support

For issues with deployment:

1. Check the troubleshooting section above
2. Review application logs: `pm2 logs er-review`
3. Check system resources: `htop` and `df -h`
4. Verify database connectivity
5. Test Nginx configuration: `sudo nginx -t`

**Important Security Notes:**

- Change default passwords immediately
- Keep the system updated
- Monitor logs regularly
- Use HTTPS in production
- Restrict SSH access to specific IP addresses
- Regular security audits recommended

---

*Last updated: $(date +'%Y-%m-%d')*